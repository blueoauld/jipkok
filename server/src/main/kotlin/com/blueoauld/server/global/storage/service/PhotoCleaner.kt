package com.blueoauld.server.global.storage.service

import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.repository.PhotoUploadRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.scheduling.annotation.Async
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class PhotoCleaner(

    private val photoUploadRepository: PhotoUploadRepository,
    private val photoStorage: PhotoStorage,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun deletePhotos(event: PhotosDeletedEvent) {
        runCatching { photoStorage.delete(event.objectKeys) }
            .onFailure { log.error(it) { "사진을 지우지 못했다. objectKeys=${event.objectKeys}" } }
    }

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA)
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
        private const val KOREA = "Asia/Seoul"
    }
}
