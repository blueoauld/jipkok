package com.blueoauld.server.domain.photo.service

import com.blueoauld.server.domain.photo.entity.PhotoUpload
import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.domain.photo.repository.PhotoUploadRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class PhotoUploadCleanerTest {

    private val photoUploadRepository = mockk<PhotoUploadRepository>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val photoUploadCleaner = PhotoUploadCleaner(
        photoUploadRepository,
        eventPublisher,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `보관 기간이 지난 발급 기록은 기록을 지우고 삭제 이벤트를 낸다`() {
        // given
        val abandoned = listOf(
            PhotoUpload(1L, "members/1/a.jpg", NOW.minus(PhotoUploadCleaner.RETENTION)),
            PhotoUpload(1L, "members/1/b.jpg", NOW.minus(PhotoUploadCleaner.RETENTION)),
        )
        every { photoUploadRepository.findAllByIssuedAtLessThan(any()) } returns abandoned
        val deleted = slot<PhotosDeletedEvent>()

        // when
        photoUploadCleaner.cleanUpAbandonedUploads()

        // then
        verify { photoUploadRepository.deleteAll(abandoned) }
        verify { eventPublisher.publishEvent(capture(deleted)) }
        assertThat(deleted.captured.objectKeys).containsExactly("members/1/a.jpg", "members/1/b.jpg")
    }

    @Test
    fun `정리할 기록이 없으면 아무것도 하지 않는다`() {
        // given
        every { photoUploadRepository.findAllByIssuedAtLessThan(any()) } returns emptyList()

        // when
        photoUploadCleaner.cleanUpAbandonedUploads()

        // then
        verify(exactly = 0) { eventPublisher.publishEvent(any()) }
        verify(exactly = 0) { photoUploadRepository.deleteAll(any<List<PhotoUpload>>()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
