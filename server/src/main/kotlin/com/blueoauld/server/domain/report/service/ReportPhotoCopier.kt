package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.report.event.PhotoCopy
import com.blueoauld.server.domain.report.event.ReportPhotosCopiedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
class ReportPhotoCopier(

    private val photoStorage: PhotoStorage,
) {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun copyPhotos(event: ReportPhotosCopiedEvent) {
        event.copies.forEach { copy(event.reportId, it) }
    }

    private fun copy(reportId: Long, copy: PhotoCopy) {
        runCatching { photoStorage.copy(copy.sourceKey, copy.targetKey) }
            .onFailure {
                log.error(it) { "신고 시점 사진을 복사하지 못했다. reportId=$reportId, objectKey=${copy.sourceKey}" }
            }
    }
}
