package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.report.dto.request.CreateReportPhotoUploadUrlRequest
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.dto.response.ReportPhotoUploadUrlResponse
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.ReportPhoto
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoUploadService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ReportService(

    private val reportRepository: ReportRepository,
    private val reportPhotoRepository: ReportPhotoRepository,
    private val memberRepository: MemberRepository,
    private val photoUploadService: PhotoUploadService,
) {

    @Transactional
    fun report(reporterId: Long, request: CreateReportRequest) {
        if (reporterId == request.reportedMemberId) {
            throw BusinessException(ErrorCode.SELF_REPORT)
        }

        if (!memberRepository.existsById(request.reportedMemberId)) {
            throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (reportRepository.existsByReporterIdAndReportedMemberId(reporterId, request.reportedMemberId)) {
            throw BusinessException(ErrorCode.DUPLICATE_REPORT)
        }

        validatePhotoKeys(reporterId, request.photoKeys)

        val report = reportRepository.save(
            Report(
                reporterId = reporterId,
                reportedMemberId = request.reportedMemberId,
                reason = request.reason,
                detail = request.detail,
            ),
        )
        reportPhotoRepository.saveAll(
            request.photoKeys.mapIndexed { index, objectKey -> ReportPhoto(report.id, index, objectKey) },
        )
        photoUploadService.confirm(request.photoKeys)
    }

    fun createPhotoUploadUrl(
        reporterId: Long,
        request: CreateReportPhotoUploadUrlRequest,
    ): ReportPhotoUploadUrlResponse {
        val issued = photoUploadService.createUploadUrl(reporterId, photoKeyPrefix(reporterId), request.contentType)

        return ReportPhotoUploadUrlResponse(issued.uploadUrl, issued.objectKey)
    }

    private fun validatePhotoKeys(reporterId: Long, objectKeys: List<String>) {
        val prefix = photoKeyPrefix(reporterId)

        if (objectKeys.size != objectKeys.toSet().size || objectKeys.any { !it.startsWith(prefix) }) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }
    }

    private fun photoKeyPrefix(reporterId: Long) = "$PHOTO_KEY_ROOT/$reporterId/"

    companion object {

        private const val PHOTO_KEY_ROOT = "reports"
    }
}
