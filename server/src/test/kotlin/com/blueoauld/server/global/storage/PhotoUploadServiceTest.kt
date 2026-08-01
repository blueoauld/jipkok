package com.blueoauld.server.global.storage

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
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
    fun `확정한 키는 발급 기록에서 지운다`() {
        // given
        val objectKeys = listOf("members/1/a.jpg")

        // when
        photoUploadService.confirm(objectKeys)

        // then
        verify { photoUploadRepository.deleteAllByObjectKeyIn(objectKeys) }
    }

    @Test
    fun `확정할 키가 없으면 아무것도 하지 않는다`() {
        // given

        // when
        photoUploadService.confirm(emptyList())

        // then
        verify(exactly = 0) { photoUploadRepository.deleteAllByObjectKeyIn(any()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
