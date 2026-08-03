package com.blueoauld.server.domain.report.dto.response

import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import java.time.Instant

data class ReportDetail(

    val reportId: Long,
    val type: ReportType,
    val reason: ReportReason,
    val detail: String?,
    val reportedAt: Instant,
    val snapshot: ReportSnapshotContent,
    val messagePhotoUrls: Map<Long, String>,
    val evidencePhotoUrls: List<String>,
    val profilePhotoUrls: List<String>,
)
