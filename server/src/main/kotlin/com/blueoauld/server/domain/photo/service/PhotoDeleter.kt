package com.blueoauld.server.domain.photo.service

import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
class PhotoDeleter(

    private val photoStorage: PhotoStorage,
) {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun deletePhotos(event: PhotosDeletedEvent) {
        runCatching { photoStorage.delete(event.objectKeys) }
            .onFailure { log.error(it) { "사진을 지우지 못했다. objectKeys=${event.objectKeys}" } }
    }
}
