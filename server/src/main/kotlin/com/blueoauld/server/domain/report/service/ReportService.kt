package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.dto.request.CreateReportPhotoUploadUrlRequest
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.dto.response.PendingReport
import com.blueoauld.server.domain.report.dto.response.ReportDetail
import com.blueoauld.server.domain.report.dto.response.ReportPhotoUploadUrlResponse
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.ReportPhoto
import com.blueoauld.server.domain.report.entity.ReportSnapshot
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.event.ReportCreatedEvent
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.repository.ReportSnapshotRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.time.Clock

private val log = KotlinLogging.logger {}

@Service
class ReportService(

    private val reportRepository: ReportRepository,
    private val reportPhotoRepository: ReportPhotoRepository,
    private val reportSnapshotRepository: ReportSnapshotRepository,
    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val photoUploadService: PhotoUploadService,
    private val photoStorage: PhotoStorage,
    private val objectMapper: ObjectMapper,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Transactional
    fun report(reporterId: Long, request: CreateReportRequest) {
        if (reporterId == request.reportedMemberId) {
            throw BusinessException(ErrorCode.SELF_REPORT)
        }

        val reporter = findMember(reporterId)
        val reported = findMember(request.reportedMemberId)

        validatePhotoKeys(reporterId, request.photoKeys)

        val room = request.roomId?.let { findRoom(reporterId, it) }
        val report = reportRepository.save(
            Report(
                reporterId = reporterId,
                reportedMemberId = request.reportedMemberId,
                type = if (room == null) ReportType.PROFILE else ReportType.CHAT,
                roomId = room?.id,
                reason = request.reason,
                detail = request.detail,
            ),
        )
        reportPhotoRepository.saveAll(
            request.photoKeys.mapIndexed { index, objectKey -> ReportPhoto(report.id, index, objectKey) },
        )
        photoUploadService.confirm(request.photoKeys)

        val snapshot = ReportSnapshotContent(
            reporter = ReporterSnapshot(reporter.id, reporter.nickname),
            reported = ReportedMemberSnapshot(
                memberId = reported.id,
                phoneNumber = reported.phoneNumber,
                nickname = reported.nickname,
                gender = reported.gender,
                birthYear = reported.birthYear,
                comment = reported.comment,
                bio = reported.bio,
                photoKeys = copyReportedPhotos(report.id, reported.id),
            ),
            messages = room?.let { copyMessages(report.id, it.id) } ?: emptyList(),
        )
        reportSnapshotRepository.save(ReportSnapshot(report.id, objectMapper.writeValueAsString(snapshot)))

        eventPublisher.publishEvent(
            ReportCreatedEvent(
                reportId = report.id,
                type = report.type,
                reason = report.reason,
                detail = report.detail,
                evidencePhotoCount = request.photoKeys.size,
                snapshot = snapshot,
            ),
        )
    }

    @Transactional(readOnly = true)
    fun findPending(): List<PendingReport> =
        reportRepository.findTop20ByHandledAtIsNullOrderByIdAsc()
            .map { PendingReport(it.id, it.type, it.reason, it.reportedMemberId, it.createdAt) }

    @Transactional
    fun handle(reportId: Long) {
        val report = reportRepository.findById(reportId).orElseThrow {
            BusinessException(ErrorCode.REPORT_NOT_FOUND)
        }

        report.handledAt = clock.instant()
    }

    @Transactional(readOnly = true)
    fun findDetail(reportId: Long): ReportDetail {
        val report = reportRepository.findById(reportId).orElseThrow {
            BusinessException(ErrorCode.REPORT_NOT_FOUND)
        }
        val snapshot = reportSnapshotRepository.findByReportId(reportId)
            ?: throw BusinessException(ErrorCode.REPORT_NOT_FOUND)
        val content = objectMapper.readValue(snapshot.content, ReportSnapshotContent::class.java)

        return ReportDetail(
            reportId = report.id,
            type = report.type,
            reason = report.reason,
            detail = report.detail,
            reportedAt = report.createdAt,
            snapshot = content,
            messagePhotoUrls = content.messages
                .mapNotNull { message -> message.photoKey?.let { message.messageId to it } }
                .associate { (messageId, key) -> messageId to photoStorage.createSignedViewUrl(key) },
            evidencePhotoUrls = reportPhotoRepository.findByReportIdOrderByDisplayOrder(reportId)
                .map { photoStorage.createSignedViewUrl(it.objectKey) },
            profilePhotoUrls = content.reported.photoKeys.map(photoStorage::createSignedViewUrl),
        )
    }

    fun createPhotoUploadUrl(
        reporterId: Long,
        request: CreateReportPhotoUploadUrlRequest,
    ): ReportPhotoUploadUrlResponse {
        val issued = photoUploadService.createUploadUrl(reporterId, evidenceKeyPrefix(reporterId), request.contentType)

        return ReportPhotoUploadUrlResponse(issued.uploadUrl, issued.objectKey)
    }

    private fun findRoom(reporterId: Long, roomId: Long) = chatRoomRepository.findById(roomId)
        .filter { it.contains(reporterId) }
        .orElseThrow { BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND) }

    private fun copyMessages(reportId: Long, roomId: Long) =
        chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(roomId, Long.MAX_VALUE, Limit.of(MESSAGE_COUNT))
            .asReversed()
            .map { message ->
                ChatMessageSnapshot(
                    messageId = message.id,
                    senderId = message.senderId,
                    type = message.type,
                    content = message.content,
                    photoKey = message.objectKey?.let { copyPhoto(reportId, it) },
                    createdAt = message.createdAt,
                )
            }

    private fun copyPhoto(reportId: Long, objectKey: String): String? {
        val targetKey = "${snapshotKeyPrefix(reportId)}${objectKey.substringAfterLast('/')}"

        return runCatching { photoStorage.copy(objectKey, targetKey) }
            .map { targetKey }
            .onFailure { log.error(it) { "신고 시점 사진을 복사하지 못했다. objectKey=$objectKey" } }
            .getOrNull()
    }

    private fun copyReportedPhotos(reportId: Long, reportedMemberId: Long) =
        memberPhotoRepository.findAllByMemberId(reportedMemberId)
            .filter { it.visibility == PhotoVisibility.PUBLIC }
            .sortedBy { it.displayOrder }
            .mapNotNull { copyPhoto(reportId, it.objectKey) }

    private fun findMember(memberId: Long) = memberRepository.findById(memberId).orElseThrow {
        BusinessException(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun validatePhotoKeys(reporterId: Long, objectKeys: List<String>) {
        val prefix = evidenceKeyPrefix(reporterId)

        if (objectKeys.size != objectKeys.toSet().size || objectKeys.any { !it.startsWith(prefix) }) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }
    }

    private fun evidenceKeyPrefix(reporterId: Long) = "$EVIDENCE_KEY_ROOT/$reporterId/"

    private fun snapshotKeyPrefix(reportId: Long) = "$SNAPSHOT_KEY_ROOT/$reportId/"

    companion object {

        private const val MESSAGE_COUNT = 50

        private const val EVIDENCE_KEY_ROOT = "reports/evidence"
        private const val SNAPSHOT_KEY_ROOT = "reports/snapshot"
    }
}
