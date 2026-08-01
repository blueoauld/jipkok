package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.report.dto.request.CreateReportPhotoUploadUrlRequest
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.ReportPhoto
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.IssuedPhotoUpload
import com.blueoauld.server.global.storage.service.PhotoUploadService
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.tuple
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class ReportServiceTest {

    private val reportRepository = mockk<ReportRepository>(relaxed = true)

    private val reportPhotoRepository = mockk<ReportPhotoRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>()

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val reportService = ReportService(
        reportRepository,
        reportPhotoRepository,
        memberRepository,
        photoUploadService,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.existsById(REPORTED_MEMBER_ID) } returns true
        every { reportRepository.existsByReporterIdAndReportedMemberId(any(), any()) } returns false
        every { reportRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `사유와 상세 내용과 증거 사진을 저장한다`() {
        // given
        val report = slot<Report>()
        val photos = slot<List<ReportPhoto>>()

        // when
        reportService.report(
            REPORTER_ID,
            CreateReportRequest(
                reportedMemberId = REPORTED_MEMBER_ID,
                reason = ReportReason.ABUSE,
                detail = "욕설을 했습니다",
                photoKeys = listOf(photoKey("a"), photoKey("b")),
            ),
        )

        // then
        verify { reportRepository.save(capture(report)) }
        verify { reportPhotoRepository.saveAll(capture(photos)) }
        assertThat(report.captured.reporterId).isEqualTo(REPORTER_ID)
        assertThat(report.captured.reportedMemberId).isEqualTo(REPORTED_MEMBER_ID)
        assertThat(report.captured.reason).isEqualTo(ReportReason.ABUSE)
        assertThat(report.captured.detail).isEqualTo("욕설을 했습니다")
        assertThat(photos.captured).extracting("displayOrder", "objectKey")
            .containsExactly(tuple(0, photoKey("a")), tuple(1, photoKey("b")))
    }

    @Test
    fun `증거 사진은 발급 기록에서 확정 처리한다`() {
        // given
        val photoKeys = listOf(photoKey("a"))

        // when
        reportService.report(REPORTER_ID, createReportRequest(photoKeys = photoKeys))

        // then
        verify { photoUploadService.confirm(photoKeys) }
    }

    @Test
    fun `자기 자신은 신고할 수 없다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.report(REPORTER_ID, createReportRequest(reportedMemberId = REPORTER_ID))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_REPORT)
        verify(exactly = 0) { reportRepository.save(any()) }
    }

    @Test
    fun `없는 회원은 신고할 수 없다`() {
        // given
        every { memberRepository.existsById(REPORTED_MEMBER_ID) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.report(REPORTER_ID, createReportRequest())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { reportRepository.save(any()) }
    }

    @Test
    fun `이미 신고한 회원은 다시 신고할 수 없다`() {
        // given
        every {
            reportRepository.existsByReporterIdAndReportedMemberId(REPORTER_ID, REPORTED_MEMBER_ID)
        } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.report(REPORTER_ID, createReportRequest())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_REPORT)
        verify(exactly = 0) { reportRepository.save(any()) }
    }

    @Test
    fun `남의 증거 사진 키를 보내면 신고에 실패한다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.report(REPORTER_ID, createReportRequest(photoKeys = listOf("reports/999/other.jpg")))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { reportRepository.save(any()) }
    }

    @Test
    fun `증거 사진 업로드 URL은 신고 폴더 아래로 발급한다`() {
        // given
        val prefix = slot<String>()
        every { photoUploadService.createUploadUrl(any(), capture(prefix), any()) } returns
                IssuedPhotoUpload("https://upload.test/key", "reports/$REPORTER_ID/key.jpg")

        // when
        val response = reportService.createPhotoUploadUrl(
            REPORTER_ID,
            CreateReportPhotoUploadUrlRequest("image/jpeg"),
        )

        // then
        assertThat(prefix.captured).isEqualTo("reports/$REPORTER_ID/")
        assertThat(response.objectKey).isEqualTo("reports/$REPORTER_ID/key.jpg")
    }

    private fun createReportRequest(
        reportedMemberId: Long = REPORTED_MEMBER_ID,
        photoKeys: List<String> = emptyList(),
    ) = CreateReportRequest(reportedMemberId, ReportReason.ABUSE, photoKeys = photoKeys)

    private fun photoKey(name: String) = "reports/$REPORTER_ID/$name.jpg"

    companion object {

        private const val REPORTER_ID = 1L
        private const val REPORTED_MEMBER_ID = 2L
    }
}
