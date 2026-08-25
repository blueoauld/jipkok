package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.dto.response.ReportDetail
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.ReportPhoto
import com.blueoauld.server.domain.report.entity.ReportSnapshot
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.event.PhotoCopy
import com.blueoauld.server.domain.report.event.ReportCreatedEvent
import com.blueoauld.server.domain.report.event.ReportPhotosCopiedEvent
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.repository.ReportSnapshotRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.CreatePhotoUploadUrlRequest
import com.blueoauld.server.global.storage.dto.PhotoUploadUrlResponse
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Limit
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

        val profilePhotoKeys = findPublicPhotoKeys(reported.id)
        val messages = room?.let { findMessages(it.id) } ?: emptyList()
        val snapshot = toSnapshot(report.id, reporter, reported, profilePhotoKeys, messages)

        reportSnapshotRepository.save(ReportSnapshot(report.id, objectMapper.writeValueAsString(snapshot)))

        eventPublisher.publishEvent(toPhotosCopiedEvent(report.id, profilePhotoKeys, messages))
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

    private fun findRoom(reporterId: Long, roomId: Long) = chatRoomRepository.findById(roomId)
        .filter { it.contains(reporterId) }
        .orElseThrow { BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND) }

    private fun findMessages(roomId: Long) =
        chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(roomId, Long.MAX_VALUE, Limit.of(MESSAGE_COUNT))
            .asReversed()

    private fun findPublicPhotoKeys(reportedMemberId: Long) =
        memberPhotoRepository.findAllByMemberId(reportedMemberId)
            .filter { it.visibility == PhotoVisibility.PUBLIC }
            .sortedBy { it.displayOrder }
            .map { it.objectKey }

    private fun toSnapshot(
        reportId: Long,
        reporter: Member,
        reported: Member,
        profilePhotoKeys: List<String>,
        messages: List<ChatMessage>,
    ) = ReportSnapshotContent(
        reporter = ReporterSnapshot(reporter.id, reporter.nickname),
        reported = ReportedMemberSnapshot(
            memberId = reported.id,
            phoneNumber = reported.phoneNumber,
            nickname = reported.nickname,
            gender = reported.gender,
            birthYear = reported.birthYear,
            comment = reported.comment,
            bio = reported.bio,
            photoKeys = profilePhotoKeys.map { snapshotKeyOf(reportId, it) },
        ),
        messages = messages.map { message ->
            ChatMessageSnapshot(
                messageId = message.id,
                senderId = message.senderId,
                type = message.type,
                content = message.content,
                photoKey = message.objectKey?.let { snapshotKeyOf(reportId, it) },
                createdAt = message.createdAt,
            )
        },
    )

    private fun toPhotosCopiedEvent(
        reportId: Long,
        profilePhotoKeys: List<String>,
        messages: List<ChatMessage>,
    ) = ReportPhotosCopiedEvent(
        reportId = reportId,
        copies = (profilePhotoKeys + messages.mapNotNull { it.objectKey })
            .map { PhotoCopy(it, snapshotKeyOf(reportId, it)) },
    )

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

    private fun snapshotKeyOf(reportId: Long, objectKey: String) =
        "$SNAPSHOT_KEY_ROOT/$reportId/${objectKey.substringAfterLast('/')}"

    companion object {

        private const val MESSAGE_COUNT = 50

        private const val EVIDENCE_KEY_ROOT = "reports/evidence"
        private const val SNAPSHOT_KEY_ROOT = "reports/snapshot"
    }
}
