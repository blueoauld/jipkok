package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminReportStatus
import com.blueoauld.server.domain.admin.dto.response.AdminChatMessageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminReportDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminReportPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminReportResponse
import com.blueoauld.server.domain.admin.dto.response.AdminReportedMemberResponse
import com.blueoauld.server.domain.admin.dto.response.AdminReporterResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.service.ReportService
import com.blueoauld.server.global.time.currentYear
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class AdminReportService(

    private val reportRepository: ReportRepository,
    private val memberRepository: MemberRepository,
    private val reportService: ReportService,
    private val adminActionRecorder: AdminActionRecorder,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findReports(
        status: AdminReportStatus,
        type: ReportType?,
        reason: ReportReason?,
        reportedMemberId: Long?,
        reportedPhoneNumber: String?,
        page: Int,
        size: Int,
    ): AdminReportPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)

        val reports = reportRepository.findAllForAdmin(
            handled = status.handled,
            type = type?.name,
            reason = reason?.name,
            reportedMemberId = reportedMemberId,
            reportedPhoneNumber = reportedPhoneNumber,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val totalCount = reportRepository.countForAdmin(
            handled = status.handled,
            type = type?.name,
            reason = reason?.name,
            reportedMemberId = reportedMemberId,
            reportedPhoneNumber = reportedPhoneNumber,
        )
        val nicknames = findNicknames(reports)

        return AdminReportPageResponse(
            items = reports.map {
                AdminReportResponse(
                    id = it.id,
                    type = it.type,
                    reason = it.reason,
                    reporterId = it.reporterId,
                    reporterNickname = nicknames[it.reporterId] ?: UNKNOWN_NICKNAME,
                    reportedMemberId = it.reportedMemberId,
                    reportedNickname = nicknames[it.reportedMemberId] ?: UNKNOWN_NICKNAME,
                    createdAt = it.createdAt,
                    handledAt = it.handledAt,
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = totalCount,
        )
    }

    @Transactional(readOnly = true)
    fun findDetail(reportId: Long): AdminReportDetailResponse {
        val detail = reportService.findDetail(reportId)
        val handledAt = reportRepository.findById(reportId).map { it.handledAt }.orElse(null)
        val reported = detail.snapshot.reported

        return AdminReportDetailResponse(
            id = detail.reportId,
            type = detail.type,
            reason = detail.reason,
            detail = detail.detail,
            createdAt = detail.reportedAt,
            handledAt = handledAt,
            reporter = AdminReporterResponse(
                id = detail.snapshot.reporter.memberId,
                nickname = detail.snapshot.reporter.nickname,
            ),
            reported = AdminReportedMemberResponse(
                id = reported.memberId,
                nickname = reported.nickname,
                phoneNumber = reported.phoneNumber,
                gender = reported.gender,
                age = clock.currentYear() - reported.birthYear,
                comment = reported.comment,
                bio = reported.bio,
                profilePhotoUrls = detail.profilePhotoUrls,
            ),
            evidencePhotoUrls = detail.evidencePhotoUrls,
            messages = detail.snapshot.messages.map {
                AdminChatMessageResponse(
                    id = it.messageId,
                    senderId = it.senderId,
                    type = it.type,
                    content = it.content,
                    photoUrl = detail.messagePhotoUrls[it.messageId],
                    createdAt = it.createdAt,
                )
            },
        )
    }

    @Transactional
    fun handle(actorId: Long, reportId: Long) {
        reportService.handle(reportId)
        adminActionRecorder.record(actorId, AdminActionType.HANDLE_REPORT, reportId)
    }

    private fun findNicknames(reports: List<Report>): Map<Long, String> {
        val memberIds = reports.flatMap { listOf(it.reporterId, it.reportedMemberId) }.distinct()

        if (memberIds.isEmpty()) return emptyMap()

        return memberRepository.findNicknamesByIdIn(memberIds).associate { it.id to it.nickname }
    }

    companion object {

        private const val UNKNOWN_NICKNAME = "알 수 없음"
    }
}
