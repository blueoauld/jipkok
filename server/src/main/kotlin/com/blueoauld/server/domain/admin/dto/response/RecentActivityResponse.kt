package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import java.time.Instant

data class RecentActivityResponse(

    val reports: List<RecentReportResponse>,
    val suspensions: List<RecentSuspensionResponse>,
)

data class RecentReportResponse(

    val id: Long,
    val type: ReportType,
    val reason: ReportReason,
    val reportedMemberId: Long,
    val reportedNickname: String,
    val createdAt: Instant,
)

data class RecentSuspensionResponse(

    val id: Long,
    val memberId: Long,
    val nickname: String,
    val type: SuspensionType,
    val reason: SuspensionReason,
    val expiresAt: Instant?,
    val createdAt: Instant,
)
