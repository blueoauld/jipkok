package com.blueoauld.server.domain.report.web

import com.blueoauld.server.domain.report.dto.request.CreateReportPhotoUploadUrlRequest
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.dto.response.ReportPhotoUploadUrlResponse
import com.blueoauld.server.domain.report.service.ReportService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/reports")
class ReportController(

    private val reportService: ReportService,
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun report(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreateReportRequest,
    ) {
        reportService.report(memberId, request)
    }

    @PostMapping("/photos/upload-url")
    fun createPhotoUploadUrl(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreateReportPhotoUploadUrlRequest,
    ): ReportPhotoUploadUrlResponse = reportService.createPhotoUploadUrl(memberId, request)
}
