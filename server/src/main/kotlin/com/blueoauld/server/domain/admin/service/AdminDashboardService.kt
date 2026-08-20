package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.access.repository.AccessLogRepository
import com.blueoauld.server.domain.admin.dto.DailyCount
import com.blueoauld.server.domain.admin.dto.response.AccessEnvironmentResponse
import com.blueoauld.server.domain.admin.dto.response.ActiveUsersResponse
import com.blueoauld.server.domain.admin.dto.response.AgeGroupResponse
import com.blueoauld.server.domain.admin.dto.response.DashboardSummaryResponse
import com.blueoauld.server.domain.admin.dto.response.DauPointResponse
import com.blueoauld.server.domain.admin.dto.response.DemographicsResponse
import com.blueoauld.server.domain.admin.dto.response.RecentActivityResponse
import com.blueoauld.server.domain.admin.dto.response.RecentReportResponse
import com.blueoauld.server.domain.admin.dto.response.RecentSuspensionResponse
import com.blueoauld.server.domain.admin.dto.response.TrendPointResponse
import com.blueoauld.server.domain.admin.dto.response.VersionCountResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.currentYear
import com.blueoauld.server.global.time.today
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate

@Service
class AdminDashboardService(

    private val memberRepository: MemberRepository,
    private val reportRepository: ReportRepository,
    private val memberSuspensionRepository: MemberSuspensionRepository,
    private val accessLogRepository: AccessLogRepository,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findSummary(): DashboardSummaryResponse {
        val todayStart = clock.today().atStartOfDay(KOREA).toInstant()

        return DashboardSummaryResponse(
            pendingMemberReports = reportRepository.countByHandledAtIsNull(),
            suspendedMembers = memberSuspensionRepository.countSuspendedMembers(clock.instant()),
            todaySignups = memberRepository.countCreatedSince(todayStart),
            todayWithdrawals = memberRepository.countDeletedSince(todayStart),
        )
    }

    @Transactional(readOnly = true)
    fun findTrend(): List<TrendPointResponse> {
        val startDate = clock.today().minusDays(TREND_DAYS - 1L)
        val start = startDate.atStartOfDay(KOREA).toInstant()

        val signups = memberRepository.countDailyCreatedSince(start).toMap()
        val withdrawals = memberRepository.countDailyDeletedSince(start).toMap()
        val reports = reportRepository.countDailyCreatedSince(start).toMap()

        return dates(startDate).map {
            TrendPointResponse(
                date = it,
                signups = signups[it] ?: 0,
                withdrawals = withdrawals[it] ?: 0,
                reports = reports[it] ?: 0,
            )
        }
    }

    @Transactional(readOnly = true)
    fun findActiveUsers(): ActiveUsersResponse {
        val today = clock.today()
        val startDate = today.minusDays(TREND_DAYS - 1L)
        val daily = accessLogRepository.countDailySince(startDate).toMap()

        return ActiveUsersResponse(
            dau = daily[today] ?: 0,
            wau = accessLogRepository.countDistinctMembersSince(today.minusDays(6)),
            mau = accessLogRepository.countDistinctMembersSince(today.minusDays(29)),
            trend = dates(startDate).map { DauPointResponse(date = it, dau = daily[it] ?: 0) },
        )
    }

    @Transactional(readOnly = true)
    fun findDemographics(): DemographicsResponse {
        val rows = memberRepository.countByGenderAndBirthYear()
        val currentYear = clock.currentYear()

        val ageGroups = AGE_GROUPS.map { group ->
            val inGroup = rows.filter { group.contains(currentYear - it.birthYear) }

            AgeGroupResponse(
                label = group.label,
                male = inGroup.filter { it.gender == Gender.MALE.name }.sumOf { it.count },
                female = inGroup.filter { it.gender == Gender.FEMALE.name }.sumOf { it.count },
            )
        }

        return DemographicsResponse(
            male = rows.filter { it.gender == Gender.MALE.name }.sumOf { it.count },
            female = rows.filter { it.gender == Gender.FEMALE.name }.sumOf { it.count },
            ageGroups = ageGroups.filter { it.label != UNDER_20_LABEL || it.male + it.female > 0 },
        )
    }

    @Transactional(readOnly = true)
    fun findAccessEnvironment(): AccessEnvironmentResponse {
        val start = clock.today().minusDays(6)
        val counts = accessLogRepository.countByPlatformSince(start).associate { it.platform to it.count }

        val versions = accessLogRepository.countByVersionSince(start)
            .map { VersionCountResponse(version = it.version, platform = it.platform, count = it.count) }
            .sortedWith(
                compareByDescending<VersionCountResponse> { versionKey(it.version) }
                    .thenBy { it.platform },
            )

        return AccessEnvironmentResponse(
            platforms = DevicePlatform.entries.associateWith { counts[it] ?: 0 },
            versions = versions,
        )
    }

    private fun versionKey(version: String): String =
        version.split(".").joinToString(".") { it.padStart(VERSION_PART_WIDTH, '0') }

    @Transactional(readOnly = true)
    fun findRecent(): RecentActivityResponse {
        val reports = reportRepository.findTop5ByOrderByIdDesc()
        val nicknames = reports.map { it.reportedMemberId }
            .distinct()
            .takeIf { it.isNotEmpty() }
            ?.let { memberRepository.findNicknamesByIdIn(it) }
            ?.associate { it.id to it.nickname }
            .orEmpty()

        return RecentActivityResponse(
            reports = reports.map {
                RecentReportResponse(
                    id = it.id,
                    type = it.type,
                    reason = it.reason,
                    reportedMemberId = it.reportedMemberId,
                    reportedNickname = nicknames[it.reportedMemberId] ?: UNKNOWN_NICKNAME,
                    createdAt = it.createdAt,
                )
            },
            suspensions = memberSuspensionRepository.findTop5ByOrderByIdDesc().map {
                RecentSuspensionResponse(
                    id = it.id,
                    memberId = it.memberId,
                    nickname = it.nickname,
                    type = it.type,
                    reason = it.reason,
                    expiresAt = it.expiresAt,
                    createdAt = it.createdAt,
                )
            },
        )
    }

    private fun dates(startDate: LocalDate) = (0 until TREND_DAYS).map { startDate.plusDays(it.toLong()) }

    private fun List<DailyCount>.toMap() = associate { it.day to it.count }

    private class AgeGroup(val label: String, private val range: IntRange) {

        fun contains(age: Int) = age in range
    }

    companion object {

        const val TREND_DAYS = 14

        private const val VERSION_PART_WIDTH = 5

        private const val UNKNOWN_NICKNAME = "알 수 없음"
        private const val UNDER_20_LABEL = "20대 미만"

        private val AGE_GROUPS = listOf(
            AgeGroup(UNDER_20_LABEL, Int.MIN_VALUE..19),
            AgeGroup("20대 초", 20..24),
            AgeGroup("20대 후", 25..29),
            AgeGroup("30대 초", 30..34),
            AgeGroup("30대 후", 35..39),
            AgeGroup("40대", 40..49),
            AgeGroup("50대 이상", 50..Int.MAX_VALUE),
        )
    }
}
