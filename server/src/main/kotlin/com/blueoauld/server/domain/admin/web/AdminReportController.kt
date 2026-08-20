package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.AdminReportStatus
import com.blueoauld.server.domain.admin.dto.response.AdminReportDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminReportPageResponse
import com.blueoauld.server.domain.admin.service.AdminReportService
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/reports")
class AdminReportController(

    private val adminReportService: AdminReportService,
) {

    @Operation(summary = "회원 신고 목록")
    @GetMapping
    fun findReports(
        @RequestParam(defaultValue = "ALL") status: AdminReportStatus,
        @RequestParam(required = false) type: ReportType?,
        @RequestParam(required = false) reason: ReportReason?,
        @RequestParam(required = false) reportedMemberId: Long?,
        @RequestParam(required = false) reportedPhoneNumber: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminReportPageResponse = adminReportService.findReports(
        status = status,
        type = type,
        reason = reason,
        reportedMemberId = reportedMemberId,
        reportedPhoneNumber = reportedPhoneNumber,
        page = page,
        size = size,
    )

    @Operation(summary = "회원 신고 상세")
    @GetMapping("/{reportId}")
    fun findDetail(@PathVariable reportId: Long): AdminReportDetailResponse =
        adminReportService.findDetail(reportId)

    @Operation(summary = "회원 신고 처리")
    @PostMapping("/{reportId}/handle")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun handle(@PathVariable reportId: Long) {
        adminReportService.handle(reportId)
    }
}
