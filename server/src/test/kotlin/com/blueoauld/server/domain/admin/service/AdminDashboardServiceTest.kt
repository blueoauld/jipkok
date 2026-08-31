package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.access.repository.AccessLogRepository
import com.blueoauld.server.domain.admin.dto.DailyCount
import com.blueoauld.server.domain.admin.dto.GenderBirthYearCount
import com.blueoauld.server.domain.admin.dto.PlatformCount
import com.blueoauld.server.domain.admin.dto.VersionCount
import com.blueoauld.server.domain.admin.repository.MemberAdminRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AdminDashboardServiceTest {

    private val memberAdminRepository = mockk<MemberAdminRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val reportRepository = mockk<ReportRepository>()

    private val memberSuspensionRepository = mockk<MemberSuspensionRepository>()

    private val accessLogRepository = mockk<AccessLogRepository>()

    private val adminDashboardService = AdminDashboardService(
        memberAdminRepository,
        memberAdminService,
        reportRepository,
        memberSuspensionRepository,
        accessLogRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `운영 요약을 오늘의 한국 시간 기준으로 집계한다`() {
        // given
        every { reportRepository.countByHandledAtIsNull() } returns 7
        every { memberSuspensionRepository.countSuspendedMembers(NOW) } returns 12
        every { memberAdminRepository.countCreatedSince(TODAY_START) } returns 41
        every { memberAdminRepository.countDeletedSince(TODAY_START) } returns 6

        // when
        val summary = adminDashboardService.findSummary()

        // then
        assertThat(summary.pendingMemberReports).isEqualTo(7)
        assertThat(summary.suspendedMembers).isEqualTo(12)
        assertThat(summary.todaySignups).isEqualTo(41)
        assertThat(summary.todayWithdrawals).isEqualTo(6)
    }

    @Test
    fun `추이는 14일을 채우고 집계가 없는 날은 0으로 둔다`() {
        // given
        every { memberAdminRepository.countDailyCreatedSince(any()) } returns listOf(dailyCount(TODAY, 5))
        every { memberAdminRepository.countDailyDeletedSince(any()) } returns listOf(dailyCount(TODAY.minusDays(1), 2))
        every { reportRepository.countDailyCreatedSince(any()) } returns emptyList()

        // when
        val trend = adminDashboardService.findTrend()

        // then
        assertThat(trend).hasSize(14)
        assertThat(trend.first().date).isEqualTo(TODAY.minusDays(13))
        assertThat(trend.last().date).isEqualTo(TODAY)
        assertThat(trend.last().signups).isEqualTo(5)
        assertThat(trend[12].withdrawals).isEqualTo(2)
        assertThat(trend.sumOf { it.reports }).isZero()
    }

    @Test
    fun `활성 회원은 오늘 접속 수와 기간별 고유 접속 수로 만든다`() {
        // given
        every { accessLogRepository.countDailySince(TODAY.minusDays(13)) } returns listOf(dailyCount(TODAY, 1284))
        every { accessLogRepository.countDistinctMembersSince(TODAY.minusDays(6)) } returns 4631
        every { accessLogRepository.countDistinctMembersSince(TODAY.minusDays(29)) } returns 11920

        // when
        val activeUsers = adminDashboardService.findActiveUsers()

        // then
        assertThat(activeUsers.dau).isEqualTo(1284)
        assertThat(activeUsers.wau).isEqualTo(4631)
        assertThat(activeUsers.mau).isEqualTo(11920)
        assertThat(activeUsers.trend).hasSize(14)
        assertThat(activeUsers.trend.last().dau).isEqualTo(1284)
        assertThat(activeUsers.trend.first().dau).isZero()
    }

    @Test
    fun `회원 구성은 나이 구간별로 성별 수를 묶는다`() {
        // given
        every { memberAdminRepository.countByGenderAndBirthYear() } returns listOf(
            genderBirthYearCount("MALE", CURRENT_YEAR - 22, 3),
            genderBirthYearCount("MALE", CURRENT_YEAR - 24, 4),
            genderBirthYearCount("FEMALE", CURRENT_YEAR - 27, 5),
            genderBirthYearCount("MALE", CURRENT_YEAR - 55, 1),
        )

        // when
        val demographics = adminDashboardService.findDemographics()

        // then
        assertThat(demographics.male).isEqualTo(8)
        assertThat(demographics.female).isEqualTo(5)
        assertThat(demographics.ageGroups.map { it.label }).containsExactly(
            "20대 초",
            "20대 후",
            "30대 초",
            "30대 후",
            "40대",
            "50대 이상",
        )
        assertThat(demographics.ageGroups.first().male).isEqualTo(7)
        assertThat(demographics.ageGroups[1].female).isEqualTo(5)
        assertThat(demographics.ageGroups.last().male).isEqualTo(1)
    }

    @Test
    fun `20대 미만 회원이 있으면 구간을 추가한다`() {
        // given
        every { memberAdminRepository.countByGenderAndBirthYear() } returns listOf(
            genderBirthYearCount("FEMALE", CURRENT_YEAR - 19, 2),
        )

        // when
        val demographics = adminDashboardService.findDemographics()

        // then
        assertThat(demographics.ageGroups.first().label).isEqualTo("20대 미만")
        assertThat(demographics.ageGroups.first().female).isEqualTo(2)
    }

    @Test
    fun `회원 구성은 캐시한다`() {
        // given
        every { memberAdminRepository.countByGenderAndBirthYear() } returns listOf(
            genderBirthYearCount("MALE", CURRENT_YEAR - 24, 4),
        )

        // when
        adminDashboardService.findDemographics()
        val demographics = adminDashboardService.findDemographics()

        // then
        assertThat(demographics.male).isEqualTo(4)
        verify(exactly = 1) { memberAdminRepository.countByGenderAndBirthYear() }
    }

    @Test
    fun `접속 환경은 집계가 없는 플랫폼을 0으로 채운다`() {
        // given
        every { accessLogRepository.countByPlatformSince(TODAY.minusDays(6)) } returns listOf(
            platformCount(DevicePlatform.IOS, 2690),
        )
        every { accessLogRepository.countByVersionSince(TODAY.minusDays(6)) } returns emptyList()

        // when
        val accessEnvironment = adminDashboardService.findAccessEnvironment()

        // then
        assertThat(accessEnvironment.platforms[DevicePlatform.IOS]).isEqualTo(2690)
        assertThat(accessEnvironment.platforms[DevicePlatform.ANDROID]).isZero()
    }

    @Test
    fun `버전 분포는 버전 숫자 내림차순으로 정렬한다`() {
        // given
        every { accessLogRepository.countByPlatformSince(TODAY.minusDays(6)) } returns emptyList()
        every { accessLogRepository.countByVersionSince(TODAY.minusDays(6)) } returns listOf(
            versionCount("1.9.0", DevicePlatform.IOS, 10),
            versionCount("1.10.0", DevicePlatform.ANDROID, 20),
            versionCount("1.10.0", DevicePlatform.IOS, 30),
        )

        // when
        val accessEnvironment = adminDashboardService.findAccessEnvironment()

        // then
        assertThat(accessEnvironment.versions.map { it.version to it.platform }).containsExactly(
            "1.10.0" to DevicePlatform.IOS,
            "1.10.0" to DevicePlatform.ANDROID,
            "1.9.0" to DevicePlatform.IOS,
        )
    }

    @Test
    fun `최근 신고에 피신고자 닉네임을 채운다`() {
        // given
        every { reportRepository.findTop5ByOrderByIdDesc() } returns listOf(
            report(reportedMemberId = 3310),
            report(reportedMemberId = 9999),
        )
        every { memberAdminService.findNicknames(listOf(3310L, 9999L)) } returns
            mapOf(3310L to "밤산책", 9999L to "알 수 없음")
        every { memberSuspensionRepository.findTop5ByOrderByIdDesc() } returns listOf(suspension())

        // when
        val recent = adminDashboardService.findRecent()

        // then
        assertThat(recent.reports.map { it.reportedNickname }).containsExactly("밤산책", "알 수 없음")
        assertThat(recent.suspensions).hasSize(1)
        assertThat(recent.suspensions.first().nickname).isEqualTo("구름빵")
    }

    @Test
    fun `신고가 없으면 빈 목록을 준다`() {
        // given
        every { reportRepository.findTop5ByOrderByIdDesc() } returns emptyList()
        every { memberAdminService.findNicknames(emptyList()) } returns emptyMap()
        every { memberSuspensionRepository.findTop5ByOrderByIdDesc() } returns emptyList()

        // when
        val recent = adminDashboardService.findRecent()

        // then
        assertThat(recent.reports).isEmpty()
    }

    private fun dailyCount(day: LocalDate, count: Long) = object : DailyCount {
        override val day = day
        override val count = count
    }

    private fun genderBirthYearCount(gender: String, birthYear: Int, count: Long) = object : GenderBirthYearCount {
        override val gender = gender
        override val birthYear = birthYear
        override val count = count
    }

    private fun platformCount(platform: DevicePlatform, count: Long) = object : PlatformCount {
        override val platform = platform
        override val count = count
    }

    private fun versionCount(version: String, platform: DevicePlatform, count: Long) = object : VersionCount {
        override val version = version
        override val platform = platform
        override val count = count
    }

    private fun report(reportedMemberId: Long) = Report(
        reporterId = 1,
        reportedMemberId = reportedMemberId,
        type = ReportType.PROFILE,
        reason = ReportReason.ABUSE,
    )

    private fun suspension() = MemberSuspension(
        phoneNumber = "+821012345678",
        memberId = 2877,
        nickname = "구름빵",
        type = SuspensionType.SERVICE,
        reason = SuspensionReason.OBSCENITY,
        startedAt = NOW,
    )

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-20T06:00:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 8, 20)
        private val TODAY_START: Instant = Instant.parse("2026-08-19T15:00:00Z")
        private const val CURRENT_YEAR = 2026
    }
}
