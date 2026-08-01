package com.blueoauld.server.global.storage.service

import com.blueoauld.server.global.storage.entity.PhotoUpload
import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.repository.PhotoUploadRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class PhotoCleanerTest {

    private val photoUploadRepository = mockk<PhotoUploadRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val photoCleaner = PhotoCleaner(
        photoUploadRepository,
        photoStorage,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `삭제 이벤트를 받으면 저장소에서 지운다`() {
        // given
        val objectKeys = listOf("members/1/a.jpg", "members/1/b.jpg")

        // when
        photoCleaner.deletePhotos(PhotosDeletedEvent(objectKeys))

        // then
        verify { photoStorage.delete(objectKeys) }
    }

    @Test
    fun `저장소 삭제가 실패해도 예외를 밖으로 던지지 않는다`() {
        // given
        every { photoStorage.delete(any()) } throws IllegalStateException("R2 오류")

        // when
        photoCleaner.deletePhotos(PhotosDeletedEvent(listOf("members/1/a.jpg")))

        // then
        verify { photoStorage.delete(any()) }
    }

    @Test
    fun `보관 기간이 지난 발급 기록은 저장소와 기록에서 함께 지운다`() {
        // given
        val abandoned = listOf(
            PhotoUpload(1L, "members/1/a.jpg", NOW.minus(PhotoCleaner.RETENTION)),
            PhotoUpload(1L, "members/1/b.jpg", NOW.minus(PhotoCleaner.RETENTION)),
        )
        every { photoUploadRepository.findAllByIssuedAtLessThan(any()) } returns abandoned
        val deleted = slot<List<String>>()

        // when
        photoCleaner.cleanUpAbandonedUploads()

        // then
        verify { photoStorage.delete(capture(deleted)) }
        verify { photoUploadRepository.deleteAll(abandoned) }
        assertThat(deleted.captured).containsExactly("members/1/a.jpg", "members/1/b.jpg")
    }

    @Test
    fun `정리할 기록이 없으면 저장소를 건드리지 않는다`() {
        // given
        every { photoUploadRepository.findAllByIssuedAtLessThan(any()) } returns emptyList()

        // when
        photoCleaner.cleanUpAbandonedUploads()

        // then
        verify(exactly = 0) { photoStorage.delete(any()) }
        verify(exactly = 0) { photoUploadRepository.deleteAll(any<List<PhotoUpload>>()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
