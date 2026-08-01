package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.report.dto.request.CreateReportPhotoUploadUrlRequest
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.ReportPhoto
import com.blueoauld.server.domain.report.entity.ReportSnapshot
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.repository.ReportSnapshotRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.IssuedPhotoUpload
import com.blueoauld.server.global.storage.service.PhotoStorage
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
import tools.jackson.databind.json.JsonMapper
import java.util.*

class ReportServiceTest {

    private val reportRepository = mockk<ReportRepository>(relaxed = true)

    private val reportPhotoRepository = mockk<ReportPhotoRepository>(relaxed = true)

    private val reportSnapshotRepository = mockk<ReportSnapshotRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>()

    private val memberPhotoRepository = mockk<MemberPhotoRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val reportService = ReportService(
        reportRepository,
        reportPhotoRepository,
        reportSnapshotRepository,
        memberRepository,
        memberPhotoRepository,
        photoUploadService,
        photoStorage,
        JsonMapper.builder().build(),
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(REPORTER_ID) } returns Optional.of(member(REPORTER_ID, "신고자"))
        every { memberRepository.findById(REPORTED_MEMBER_ID) } returns Optional.of(member(REPORTED_MEMBER_ID, "피신고자"))
        every { memberPhotoRepository.findAllByMemberId(REPORTED_MEMBER_ID) } returns emptyList()
        every { reportRepository.existsByReporterIdAndReportedMemberId(any(), any()) } returns false
        every { reportRepository.save(any()) } answers { firstArg() }
        every { reportSnapshotRepository.save(any()) } answers { firstArg() }
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
    fun `신고 시점의 회원 정보를 스냅샷으로 남긴다`() {
        // given
        val snapshot = slot<ReportSnapshot>()

        // when
        reportService.report(REPORTER_ID, createReportRequest())

        // then
        verify { reportSnapshotRepository.save(capture(snapshot)) }
        assertThat(snapshot.captured.content)
            .contains("\"nickname\":\"신고자\"")
            .contains("\"nickname\":\"피신고자\"")
            .contains("\"birthYear\":1998")
            .contains("\"phoneNumber\":\"01012345672\"")
    }

    @Test
    fun `피신고자의 공개 사진을 신고 경로로 복사해 스냅샷에 담는다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(REPORTED_MEMBER_ID) } returns listOf(
            MemberPhoto(REPORTED_MEMBER_ID, PhotoVisibility.PUBLIC, 0, "members/2/a.jpg"),
            MemberPhoto(REPORTED_MEMBER_ID, PhotoVisibility.SECRET, 0, "members/2/s.jpg"),
        )
        val snapshot = slot<ReportSnapshot>()

        // when
        reportService.report(REPORTER_ID, createReportRequest())

        // then
        verify { photoStorage.copy("members/2/a.jpg", "reports/snapshot/0/a.jpg") }
        verify(exactly = 0) { photoStorage.copy("members/2/s.jpg", any()) }
        verify { reportSnapshotRepository.save(capture(snapshot)) }
        assertThat(snapshot.captured.content).contains("reports/snapshot/0/a.jpg")
    }

    @Test
    fun `사진 복사가 실패해도 신고는 접수된다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(REPORTED_MEMBER_ID) } returns listOf(
            MemberPhoto(REPORTED_MEMBER_ID, PhotoVisibility.PUBLIC, 0, "members/2/a.jpg"),
        )
        every { photoStorage.copy(any(), any()) } throws IllegalStateException("R2 오류")
        val snapshot = slot<ReportSnapshot>()

        // when
        reportService.report(REPORTER_ID, createReportRequest())

        // then
        verify { reportRepository.save(any()) }
        verify { reportSnapshotRepository.save(capture(snapshot)) }
        assertThat(snapshot.captured.content).contains("\"photoKeys\":[]")
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
        every { memberRepository.findById(REPORTED_MEMBER_ID) } returns Optional.empty()

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
            reportService.report(REPORTER_ID, createReportRequest(photoKeys = listOf("reports/evidence/999/other.jpg")))
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
                IssuedPhotoUpload("https://upload.test/key", "reports/evidence/$REPORTER_ID/key.jpg")

        // when
        val response = reportService.createPhotoUploadUrl(
            REPORTER_ID,
            CreateReportPhotoUploadUrlRequest("image/jpeg"),
        )

        // then
        assertThat(prefix.captured).isEqualTo("reports/evidence/$REPORTER_ID/")
        assertThat(response.objectKey).isEqualTo("reports/evidence/$REPORTER_ID/key.jpg")
    }

    private fun createReportRequest(
        reportedMemberId: Long = REPORTED_MEMBER_ID,
        photoKeys: List<String> = emptyList(),
    ) = CreateReportRequest(reportedMemberId, ReportReason.ABUSE, photoKeys = photoKeys)

    private fun photoKey(name: String) = "reports/evidence/$REPORTER_ID/$name.jpg"

    private fun member(id: Long, nickname: String) = mockk<Member>(relaxed = true) {
        every { this@mockk.id } returns id
        every { this@mockk.nickname } returns nickname
        every { phoneNumber } returns "0101234567$id"
        every { gender } returns Gender.MALE
        every { birthYear } returns 1998
    }

    companion object {

        private const val REPORTER_ID = 1L
        private const val REPORTED_MEMBER_ID = 2L
    }
}
