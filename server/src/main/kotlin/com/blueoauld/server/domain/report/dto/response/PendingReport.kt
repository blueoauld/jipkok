package com.blueoauld.server.domain.report.dto.response

import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import java.time.Instant

data class PendingReport(

    val reportId: Long,
    val type: ReportType,
    val reason: ReportReason,
    val reportedMemberId: Long,
    val reportedAt: Instant,
)
