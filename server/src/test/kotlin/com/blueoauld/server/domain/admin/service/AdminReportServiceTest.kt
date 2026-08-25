package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminReportStatus
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.dto.response.ReportDetail
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.service.ReportService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AdminReportServiceTest {

    private val reportRepository = mockk<ReportRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val reportService = mockk<ReportService>()

    private val adminActionRecorder = mockk<AdminActionRecorder>(relaxed = true)

    private val adminReportService = AdminReportService(
        reportRepository,
        memberAdminService,
        reportService,
        adminActionRecorder,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `목록은 상태를 처리 여부로 바꾸고 닉네임을 채운다`() {
        // given
        every {
            reportRepository.findAllForAdmin(false, null, null, null, null, 20, 0)
        } returns listOf(report())
        every { reportRepository.countForAdmin(false, null, null, null, null) } returns 1
        every { memberAdminService.findNicknames(listOf(REPORTER_ID, REPORTED_MEMBER_ID)) } returns
            mapOf(REPORTER_ID to "밤산책", REPORTED_MEMBER_ID to "알 수 없음")

        // when
        val response = adminReportService.findReports(
            status = AdminReportStatus.PENDING,
            type = null,
            reason = null,
            reportedMemberId = null,
            reportedPhoneNumber = null,
            page = 1,
            size = 20,
        )

        // then
        assertThat(response.totalCount).isEqualTo(1)
        assertThat(response.items.first().reporterNickname).isEqualTo("밤산책")
        assertThat(response.items.first().reportedNickname).isEqualTo("알 수 없음")
    }

    @Test
    fun `페이지와 크기를 안전한 범위로 맞춘다`() {
        // given
        every { reportRepository.findAllForAdmin(null, null, null, null, null, 100, 0) } returns emptyList()
        every { reportRepository.countForAdmin(null, null, null, null, null) } returns 0
        every { memberAdminService.findNicknames(emptyList()) } returns emptyMap()

        // when
        val response = adminReportService.findReports(
            status = AdminReportStatus.ALL,
            type = null,
            reason = null,
            reportedMemberId = null,
            reportedPhoneNumber = null,
            page = 0,
            size = 500,
        )

        // then
        assertThat(response.page).isEqualTo(1)
        assertThat(response.size).isEqualTo(100)
    }

    @Test
    fun `상세는 스냅샷과 사진 URL을 합쳐서 준다`() {
        // given
        every { reportService.findDetail(REPORT_ID) } returns detail()
        every { reportRepository.findById(REPORT_ID) } returns Optional.of(report())

        // when
        val response = adminReportService.findDetail(REPORT_ID)

        // then
        assertThat(response.reported.age).isEqualTo(28)
        assertThat(response.reported.phoneNumber).isEqualTo("+821011112222")
        assertThat(response.messages).hasSize(2)
        assertThat(response.messages[0].photoUrl).isNull()
        assertThat(response.messages[1].photoUrl).isEqualTo("https://photo/70001")
    }

    @Test
    fun `처리는 신고 서비스에 위임한다`() {
        // given
        every { reportService.handle(REPORT_ID) } returns true

        // when
        adminReportService.handle(ACTOR_ID, REPORT_ID)

        // then
        verify { reportService.handle(REPORT_ID) }
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.HANDLE_REPORT, REPORT_ID) }
    }

    @Test
    fun `이미 처리된 신고는 감사 기록을 남기지 않는다`() {
        // given
        every { reportService.handle(REPORT_ID) } returns false

        // when
        adminReportService.handle(ACTOR_ID, REPORT_ID)

        // then
        verify(exactly = 0) { adminActionRecorder.record(any(), any(), any()) }
    }

    private fun report() = Report(
        reporterId = REPORTER_ID,
        reportedMemberId = REPORTED_MEMBER_ID,
        reportedPhoneNumber = "+821011112222",
        type = ReportType.CHAT,
        reason = ReportReason.ABUSE,
    )

    private fun detail() = ReportDetail(
        reportId = REPORT_ID,
        type = ReportType.CHAT,
        reason = ReportReason.ABUSE,
        detail = "욕설이 심합니다",
        reportedAt = NOW,
        snapshot = ReportSnapshotContent(
            reporter = ReporterSnapshot(REPORTER_ID, "밤산책"),
            reported = ReportedMemberSnapshot(
                memberId = REPORTED_MEMBER_ID,
                phoneNumber = "+821011112222",
                nickname = "구름빵",
                gender = Gender.FEMALE,
                birthYear = 1998,
                comment = null,
                bio = null,
                photoKeys = emptyList(),
            ),
            messages = listOf(
                ChatMessageSnapshot(
                    messageId = 70000,
                    senderId = REPORTER_ID,
                    type = ChatMessageType.TEXT,
                    content = "안녕하세요",
                    photoKey = null,
                    createdAt = NOW,
                ),
                ChatMessageSnapshot(
                    messageId = 70001,
                    senderId = REPORTED_MEMBER_ID,
                    type = ChatMessageType.PHOTO,
                    content = null,
                    photoKey = "reports/1/photo.jpg",
                    createdAt = NOW,
                ),
            ),
        ),
        messagePhotoUrls = mapOf(70001L to "https://photo/70001"),
        evidencePhotoUrls = emptyList(),
        profilePhotoUrls = emptyList(),
    )

    companion object {

        private const val REPORT_ID = 1042L
        private const val ACTOR_ID = 7L
        private const val REPORTER_ID = 3310L
        private const val REPORTED_MEMBER_ID = 2877L

        private val NOW: Instant = Instant.parse("2026-08-20T06:00:00Z")
    }
}
