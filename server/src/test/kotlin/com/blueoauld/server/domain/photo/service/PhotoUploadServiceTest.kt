package com.blueoauld.server.domain.photo.service

import com.blueoauld.server.domain.photo.entity.PhotoUpload
import com.blueoauld.server.domain.photo.repository.PhotoUploadRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.StoredObject
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class PhotoUploadServiceTest {

    private val photoUploadRepository = mockk<PhotoUploadRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val photoUploadService = PhotoUploadService(
        photoUploadRepository,
        photoStorage,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { photoUploadRepository.save(any()) } answers { firstArg() }
        every { photoStorage.createUploadUrl(any(), any()) } answers { "https://upload.test/${firstArg<String>()}" }
    }

    @Test
    fun `주어진 경로 아래에 키를 만들고 발급 기록을 남긴다`() {
        // given
        val issuedRecord = slot<PhotoUpload>()

        // when
        val issued = photoUploadService.createUploadUrl(1L, "members/1/", "image/jpeg")

        // then
        verify { photoUploadRepository.save(capture(issuedRecord)) }
        assertThat(issued.objectKey).startsWith("members/1/")
        assertThat(issued.objectKey).endsWith(".jpg")
        assertThat(issued.uploadUrl).isEqualTo("https://upload.test/${issued.objectKey}")
        assertThat(issuedRecord.captured.objectKey).isEqualTo(issued.objectKey)
        assertThat(issuedRecord.captured.issuedAt).isEqualTo(NOW)
    }

    @Test
    fun `지원하지 않는 이미지 형식이면 발급하지 않는다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            photoUploadService.createUploadUrl(1L, "members/1/", "application/pdf")
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.UNSUPPORTED_IMAGE_TYPE)
        verify(exactly = 0) { photoUploadRepository.save(any()) }
    }

    @Test
    fun `이미지 발급은 동영상 형식을 거절한다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            photoUploadService.createUploadUrl(1L, "members/1/", "video/mp4")
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.UNSUPPORTED_IMAGE_TYPE)
        verify(exactly = 0) { photoUploadRepository.save(any()) }
    }

    @Test
    fun `미디어 발급은 동영상 형식도 받는다`() {
        // given

        // when
        val issued = photoUploadService.createMediaUploadUrl(1L, "chats/1/", "video/mp4")

        // then
        assertThat(issued.objectKey).startsWith("chats/1/")
        assertThat(issued.objectKey).endsWith(".mp4")
    }

    @Test
    fun `확정한 키는 발급 기록에서 지운다`() {
        // given
        val upload = issued(PHOTO_KEY)
        stored(PHOTO_KEY, contentLength = 1_000, contentType = "image/jpeg")

        // when
        photoUploadService.confirm(listOf(PHOTO_KEY))

        // then
        verify { photoUploadRepository.deleteAll(listOf(upload)) }
    }

    @Test
    fun `확정할 키가 없으면 아무것도 하지 않는다`() {
        // given

        // when
        photoUploadService.confirm(emptyList())

        // then
        verify(exactly = 0) { photoUploadRepository.findAllByObjectKeyIn(any()) }
    }

    @Test
    fun `이미 확정된 키는 다시 확인하지 않는다`() {
        // given
        every { photoUploadRepository.findAllByObjectKeyIn(any()) } returns emptyList()

        // when
        photoUploadService.confirm(listOf(PHOTO_KEY))

        // then
        verify(exactly = 0) { photoStorage.head(any()) }
    }

    @Test
    fun `올라오지 않은 키는 확정할 수 없다`() {
        // given
        issued(PHOTO_KEY)
        every { photoStorage.head(PHOTO_KEY) } returns null

        // when
        val exception = assertThrows(BusinessException::class.java) {
            photoUploadService.confirm(listOf(PHOTO_KEY))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { photoUploadRepository.deleteAll(any<List<PhotoUpload>>()) }
    }

    @Test
    fun `상한을 넘은 사진은 지우고 거절한다`() {
        // given
        issued(PHOTO_KEY)
        stored(
            PHOTO_KEY,
            contentLength = PhotoUploadService.PHOTO_MAX_BYTES + 1,
            contentType = "image/jpeg",
        )

        // when
        val exception = assertThrows(BusinessException::class.java) {
            photoUploadService.confirm(listOf(PHOTO_KEY))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.PHOTO_TOO_LARGE)
        verify { photoStorage.delete(listOf(PHOTO_KEY)) }
    }

    @Test
    fun `상한과 같은 크기는 받는다`() {
        // given
        issued(PHOTO_KEY)
        stored(
            PHOTO_KEY,
            contentLength = PhotoUploadService.PHOTO_MAX_BYTES,
            contentType = "image/jpeg",
        )

        // when
        photoUploadService.confirm(listOf(PHOTO_KEY))

        // then
        verify(exactly = 0) { photoStorage.delete(any()) }
    }

    @Test
    fun `동영상은 사진 상한 대신 동영상 상한으로 검사한다`() {
        // given
        issued(VIDEO_KEY)
        stored(
            VIDEO_KEY,
            contentLength = PhotoUploadService.VIDEO_MAX_BYTES,
            contentType = "video/mp4",
        )

        // when
        photoUploadService.confirm(listOf(VIDEO_KEY))

        // then
        verify(exactly = 0) { photoStorage.delete(any()) }
    }

    @Test
    fun `상한을 넘은 동영상은 지우고 거절한다`() {
        // given
        issued(VIDEO_KEY)
        stored(
            VIDEO_KEY,
            contentLength = PhotoUploadService.VIDEO_MAX_BYTES + 1,
            contentType = "video/mp4",
        )

        // when
        val exception = assertThrows(BusinessException::class.java) {
            photoUploadService.confirm(listOf(VIDEO_KEY))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.VIDEO_TOO_LARGE)
        verify { photoStorage.delete(listOf(VIDEO_KEY)) }
    }

    private fun issued(objectKey: String): PhotoUpload {
        val upload = PhotoUpload(1L, objectKey, NOW)
        every { photoUploadRepository.findAllByObjectKeyIn(listOf(objectKey)) } returns listOf(upload)

        return upload
    }

    private fun stored(objectKey: String, contentLength: Long, contentType: String) {
        every { photoStorage.head(objectKey) } returns StoredObject(contentLength, contentType)
    }

    companion object {

        private const val PHOTO_KEY = "members/1/a.jpg"
        private const val VIDEO_KEY = "chats/1/a.mp4"

        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
