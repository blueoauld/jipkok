package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.dto.request.CreateReportPhotoUploadUrlRequest
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.dto.response.ReportPhotoUploadUrlResponse
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.ReportPhoto
import com.blueoauld.server.domain.report.entity.ReportSnapshot
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.repository.ReportSnapshotRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper

private val log = KotlinLogging.logger {}

@Service
class ReportService(

    private val reportRepository: ReportRepository,
    private val reportPhotoRepository: ReportPhotoRepository,
    private val reportSnapshotRepository: ReportSnapshotRepository,
    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val photoUploadService: PhotoUploadService,
    private val photoStorage: PhotoStorage,
    private val objectMapper: ObjectMapper,
) {

    @Transactional
    fun report(reporterId: Long, request: CreateReportRequest) {
        if (reporterId == request.reportedMemberId) {
            throw BusinessException(ErrorCode.SELF_REPORT)
        }

        val reporter = findMember(reporterId)
        val reported = findMember(request.reportedMemberId)

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

        val snapshot = ReportSnapshotContent(
            reporter = ReporterSnapshot(reporter.id, reporter.nickname),
            reported = ReportedMemberSnapshot(
                memberId = reported.id,
                phoneNumber = reported.phoneNumber,
                nickname = reported.nickname,
                gender = reported.gender,
                birthYear = reported.birthYear,
                comment = reported.comment,
                bio = reported.bio,
                photoKeys = copyReportedPhotos(report.id, reported.id),
            ),
        )
        reportSnapshotRepository.save(ReportSnapshot(report.id, objectMapper.writeValueAsString(snapshot)))
    }

    fun createPhotoUploadUrl(
        reporterId: Long,
        request: CreateReportPhotoUploadUrlRequest,
    ): ReportPhotoUploadUrlResponse {
        val issued = photoUploadService.createUploadUrl(reporterId, evidenceKeyPrefix(reporterId), request.contentType)

        return ReportPhotoUploadUrlResponse(issued.uploadUrl, issued.objectKey)
    }

    private fun copyReportedPhotos(reportId: Long, reportedMemberId: Long) =
        memberPhotoRepository.findAllByMemberId(reportedMemberId)
            .filter { it.visibility == PhotoVisibility.PUBLIC }
            .sortedBy { it.displayOrder }
            .mapNotNull { photo ->
                val targetKey = "${snapshotKeyPrefix(reportId)}${photo.objectKey.substringAfterLast('/')}"

                runCatching { photoStorage.copy(photo.objectKey, targetKey) }
                    .map { targetKey }
                    .onFailure { log.error(it) { "신고 시점 사진을 복사하지 못했다. objectKey=${photo.objectKey}" } }
                    .getOrNull()
            }

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

    private fun snapshotKeyPrefix(reportId: Long) = "$SNAPSHOT_KEY_ROOT/$reportId/"

    companion object {

        private const val EVIDENCE_KEY_ROOT = "reports/evidence"
        private const val SNAPSHOT_KEY_ROOT = "reports/snapshot"
    }
}
