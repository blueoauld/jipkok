package com.blueoauld.server.domain.report.event

import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType

data class ReportCreatedEvent(

    val reportId: Long,
    val type: ReportType,
    val reason: ReportReason,
    val snapshot: ReportSnapshotContent,
)
