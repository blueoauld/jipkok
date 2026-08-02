package com.blueoauld.server.domain.report.dto.request

import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.type.ReportReason
import jakarta.validation.constraints.Size

data class CreateReportRequest(

    val reportedMemberId: Long,

    val roomId: Long? = null,

    val reason: ReportReason,

    @field:Size(max = Report.DETAIL_MAX_LENGTH, message = "상세 내용이 너무 깁니다.")
    val detail: String? = null,

    @field:Size(max = Report.PHOTO_MAX_COUNT, message = "증거 사진은 6장까지 올릴 수 있습니다.")
    val photoKeys: List<String> = emptyList(),
)
