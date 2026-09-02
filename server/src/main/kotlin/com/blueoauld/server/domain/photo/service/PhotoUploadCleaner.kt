package com.blueoauld.server.domain.photo.service

import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.domain.photo.repository.PhotoUploadRepository
import com.blueoauld.server.global.time.KOREA_ID
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class PhotoUploadCleaner(

    private val photoUploadRepository: PhotoUploadRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUpAbandonedUploads() {
        val abandoned = photoUploadRepository.findAllByIssuedAtLessThan(clock.instant().minus(RETENTION))

        if (abandoned.isEmpty()) {
            return
        }

        photoUploadRepository.deleteAll(abandoned)
        eventPublisher.publishEvent(PhotosDeletedEvent(abandoned.map { it.objectKey }))
        log.info { "확정되지 않은 사진 ${abandoned.size}건을 정리했다." }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(1)

        private const val CLEAN_UP_CRON = "0 0 4 * * *"
    }
}
