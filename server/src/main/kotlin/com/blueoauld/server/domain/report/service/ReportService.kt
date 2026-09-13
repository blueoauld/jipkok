package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.repository.getRoomOf
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.photo.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.photo.service.PhotoUploadService
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.dto.response.ReportDetail
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
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.time.Clock

@Service
class ReportService(

    private val reportRepository: ReportRepository,
    private val reportPhotoRepository: ReportPhotoRepository,
    private val reportSnapshotRepository: ReportSnapshotRepository,
    private val memberRepository: MemberRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val reportSnapshotBuilder: ReportSnapshotBuilder,
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

        val reporter = memberRepository.getMember(reporterId)
        val reported = memberRepository.getMember(request.reportedMemberId)

        validatePhotoKeys(reporterId, request.photoKeys)

        val room = request.roomId?.let { findRoomWith(reporterId, it, request.reportedMemberId) }
        val report = reportRepository.save(
            Report(
                reporterId = reporterId,
                reportedMemberId = request.reportedMemberId,
                reportedPhoneNumber = reported.phoneNumber,
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

        val built = reportSnapshotBuilder.build(report.id, reporter, reported, room?.id)

        reportSnapshotRepository.save(ReportSnapshot(report.id, objectMapper.writeValueAsString(built.content)))

        eventPublisher.publishEvent(built.photosCopiedEvent)
        eventPublisher.publishEvent(
            ReportCreatedEvent(
                reportId = report.id,
                type = report.type,
                reason = report.reason,
                snapshot = built.content,
            ),
        )
    }

    @Transactional
    fun handle(reportId: Long): Boolean {
        val report = reportRepository.findById(reportId).orElseThrow {
            BusinessException(ErrorCode.REPORT_NOT_FOUND)
        }

        if (report.handledAt != null) {
            return false
        }

        report.handledAt = clock.instant()

        return true
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
            handledAt = report.handledAt,
            snapshot = content,
            messagePhotoUrls = content.messages
                .mapNotNull { message -> message.photoKey?.let { message.messageId to it } }
                .associate { (messageId, key) -> messageId to photoStorage.createSignedViewUrl(key) },
            evidencePhotoUrls = reportPhotoRepository.findByReportIdOrderByDisplayOrder(reportId)
                .map { photoStorage.createSignedViewUrl(it.objectKey) },
            profilePhotoUrls = content.reported.photoKeys.map(photoStorage::createSignedViewUrl),
        )
    }

    fun createPhotoUploadUrl(reporterId: Long, request: CreatePhotoUploadUrlRequest): PhotoUploadUrlResponse =
        photoUploadService.createUploadUrl(reporterId, evidenceKeyPrefix(reporterId), request.contentType)

    private fun findRoomWith(reporterId: Long, roomId: Long, reportedMemberId: Long): ChatRoom {
        val room = chatRoomRepository.getRoomOf(reporterId, roomId)

        if (room.partnerIdOf(reporterId) != reportedMemberId) {
            throw BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND)
        }

        return room
    }

    private fun validatePhotoKeys(reporterId: Long, objectKeys: List<String>) {
        val prefix = evidenceKeyPrefix(reporterId)

        if (objectKeys.size != objectKeys.toSet().size || objectKeys.any { !it.startsWith(prefix) }) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }
    }

    private fun evidenceKeyPrefix(reporterId: Long) = "$EVIDENCE_KEY_ROOT/$reporterId/"

    companion object {

        private const val EVIDENCE_KEY_ROOT = "reports/evidence"
    }
}
