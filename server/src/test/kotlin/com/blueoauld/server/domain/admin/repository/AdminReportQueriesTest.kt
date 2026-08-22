package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.repository.ReportRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AdminReportQueriesTest {

    @Autowired
    private lateinit var reportRepository: ReportRepository

    @BeforeEach
    fun setUp() {
        saveReport(reportedMemberId = 1, phoneNumber = "+821011112222", reason = ReportReason.ABUSE)
        saveReport(reportedMemberId = 1, phoneNumber = "+821011112222", reason = ReportReason.ETC, handled = true)
        saveReport(
            reportedMemberId = 2,
            phoneNumber = "+821033334444",
            reason = ReportReason.ABUSE,
            type = ReportType.CHAT,
        )
    }

    @Test
    fun `필터 없이 전체를 최신 순으로 준다`() {
        // given

        // when
        val reports = reportRepository.findAllForAdmin(null, null, null, null, null, 20, 0)

        // then
        assertThat(reports).hasSize(3)
        assertThat(reports.map { it.id }).isSortedAccordingTo(reverseOrder())
        assertThat(reportRepository.countForAdmin(null, null, null, null, null)).isEqualTo(3)
    }

    @Test
    fun `처리 여부와 종류, 사유로 거른다`() {
        // given

        // when
        val pending = reportRepository.findAllForAdmin(false, null, null, null, null, 20, 0)
        val chats = reportRepository.findAllForAdmin(null, ReportType.CHAT.name, null, null, null, 20, 0)
        val etc = reportRepository.findAllForAdmin(null, null, ReportReason.ETC.name, null, null, 20, 0)

        // then
        assertThat(pending).hasSize(2)
        assertThat(chats).hasSize(1)
        assertThat(etc).hasSize(1)
    }

    @Test
    fun `피신고자 ID와 전화번호로 거른다`() {
        // given

        // when
        val byMember = reportRepository.findAllForAdmin(null, null, null, 1, null, 20, 0)
        val byPhone = reportRepository.findAllForAdmin(null, null, null, null, "+821011112222", 20, 0)

        // then
        assertThat(byMember).hasSize(2)
        assertThat(byPhone).hasSize(2)
        assertThat(reportRepository.countForAdmin(null, null, null, null, "+821011112222")).isEqualTo(2)
    }

    @Test
    fun `페이지 크기와 오프셋을 적용한다`() {
        // given

        // when
        val firstPage = reportRepository.findAllForAdmin(null, null, null, null, null, 2, 0)
        val secondPage = reportRepository.findAllForAdmin(null, null, null, null, null, 2, 2)

        // then
        assertThat(firstPage).hasSize(2)
        assertThat(secondPage).hasSize(1)
        assertThat(firstPage.first().id).isGreaterThan(secondPage.first().id)
    }

    private fun saveReport(
        reportedMemberId: Long,
        phoneNumber: String,
        reason: ReportReason,
        type: ReportType = ReportType.PROFILE,
        handled: Boolean = false,
    ) {
        val report = Report(
            reporterId = 100,
            reportedMemberId = reportedMemberId,
            reportedPhoneNumber = phoneNumber,
            type = type,
            reason = reason,
        )

        if (handled) report.handledAt = Instant.parse("2026-08-20T00:00:00Z")

        reportRepository.saveAndFlush(report)
    }

    private fun reverseOrder() = Comparator<Long> { a, b -> b.compareTo(a) }
}
