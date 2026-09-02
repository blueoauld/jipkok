package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.entity.ReportSnapshot
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.repository.ReportSnapshotRepository
import com.blueoauld.server.global.time.KOREA_ID
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class ReportCleaner(

    private val reportRepository: ReportRepository,
    private val reportPhotoRepository: ReportPhotoRepository,
    private val reportSnapshotRepository: ReportSnapshotRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val objectMapper: ObjectMapper,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUpOldReports() {
        val reportIds = reportRepository.findHandledIdsCreatedBefore(clock.instant().minus(RETENTION))

        if (reportIds.isEmpty()) {
            return
        }

        val snapshots = reportSnapshotRepository.findAllByReportIdIn(reportIds)
        val objectKeys = reportPhotoRepository.findAllByReportIdIn(reportIds).map { it.objectKey } +
            snapshots.flatMap(::objectKeysOf)

        reportPhotoRepository.deleteAllByReportIdIn(reportIds)
        reportSnapshotRepository.deleteAllByReportIdIn(reportIds)
        reportRepository.deleteAllByIdIn(reportIds)

        if (objectKeys.isNotEmpty()) {
            eventPublisher.publishEvent(PhotosDeletedEvent(objectKeys))
        }

        log.info { "신고 ${reportIds.size}건을 정리했다." }
    }

    private fun objectKeysOf(snapshot: ReportSnapshot) = runCatching {
        val content = objectMapper.readValue(snapshot.content, ReportSnapshotContent::class.java)

        content.reported.photoKeys + content.messages.mapNotNull { it.photoKey }
    }.onFailure { log.error(it) { "신고 스냅샷을 읽지 못했다. reportId=${snapshot.reportId}" } }
        .getOrDefault(emptyList())

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)

        private const val CLEAN_UP_CRON = "0 45 4 * * *"
    }
}
