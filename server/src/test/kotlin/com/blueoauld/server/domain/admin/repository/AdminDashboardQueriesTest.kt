package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.access.entity.AccessLog
import com.blueoauld.server.domain.access.repository.AccessLogRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AdminDashboardQueriesTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var memberAdminRepository: MemberAdminRepository

    @Autowired
    private lateinit var reportRepository: ReportRepository

    @Autowired
    private lateinit var reportAdminRepository: ReportAdminRepository

    @Autowired
    private lateinit var memberSuspensionRepository: MemberSuspensionRepository

    @Autowired
    private lateinit var suspensionAdminRepository: SuspensionAdminRepository

    @Autowired
    private lateinit var accessLogRepository: AccessLogRepository

    @Autowired
    private lateinit var accessLogAdminRepository: AccessLogAdminRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Test
    fun `일별 가입 수는 한국 시간 날짜로 묶는다`() {
        // given
        val memberId = saveMember("+821088880001").id
        val boundaryId = saveMember("+821088880002").id
        setCreatedAt("member", memberId, Instant.parse("2026-08-19T10:00:00Z"))
        setCreatedAt("member", boundaryId, Instant.parse("2026-08-19T15:30:00Z"))

        // when
        val counts = memberAdminRepository.countDailyCreatedSince(Instant.parse("2026-08-19T00:00:00Z"))

        // then
        val byDay = counts.associate { it.day to it.count }
        assertThat(byDay[LocalDate.of(2026, 8, 19)]).isEqualTo(1)
        assertThat(byDay[LocalDate.of(2026, 8, 20)]).isEqualTo(1)
    }

    @Test
    fun `신규 가입 수는 시작 시각부터 센다`() {
        // given
        val beforeId = saveMember("+821088880011").id
        val afterId = saveMember("+821088880012").id
        setCreatedAt("member", beforeId, Instant.parse("2026-08-18T23:59:59Z"))
        setCreatedAt("member", afterId, Instant.parse("2026-08-19T00:00:00Z"))

        // when
        val count = memberAdminRepository.countCreatedSince(Instant.parse("2026-08-19T00:00:00Z"))

        // then
        assertThat(count).isEqualTo(1)
    }

    @Test
    fun `AI 계정은 가입, 탈퇴, 회원 구성 집계에서 뺀다`() {
        // given
        val ai = saveMember("AI-0000000000001", role = MemberRole.AI)
        val since = Instant.now().minusSeconds(60)
        val maleCountWithAi = memberAdminRepository.countByGenderAndBirthYear()
            .filter { it.birthYear == 1998 && it.gender == Gender.MALE.name }
            .sumOf { it.count }
        memberRepository.delete(ai)
        entityManager.flush()

        // when
        val created = memberAdminRepository.countCreatedSince(since)
        val dailyCreated = memberAdminRepository.countDailyCreatedSince(since)
        val deleted = memberAdminRepository.countDeletedSince(since)
        val dailyDeleted = memberAdminRepository.countDailyDeletedSince(since)

        // then
        assertThat(created).isZero()
        assertThat(dailyCreated.sumOf { it.count }).isZero()
        assertThat(deleted).isZero()
        assertThat(dailyDeleted.sumOf { it.count }).isZero()
        assertThat(maleCountWithAi).isZero()
    }

    @Test
    fun `탈퇴 집계는 탈퇴 시각을 기준으로 센다`() {
        // given
        val member = saveMember("+821088880003")
        memberRepository.delete(member)
        entityManager.flush()

        // when
        val count = memberAdminRepository.countDeletedSince(Instant.now().minusSeconds(60))
        val daily = memberAdminRepository.countDailyDeletedSince(Instant.now().minusSeconds(60))

        // then
        assertThat(count).isEqualTo(1)
        assertThat(daily.sumOf { it.count }).isEqualTo(1)
    }

    @Test
    fun `회원 구성은 탈퇴 회원을 빼고 성별과 출생연도로 묶는다`() {
        // given
        saveMember("+821088880004", Gender.MALE, 1998)
        saveMember("+821088880005", Gender.FEMALE, 1998)
        val withdrawn = saveMember("+821088880006", Gender.MALE, 1998)
        memberRepository.delete(withdrawn)
        entityManager.flush()

        // when
        val rows = memberAdminRepository.countByGenderAndBirthYear()

        // then
        val row1998 = rows.filter { it.birthYear == 1998 }
        assertThat(row1998.first { it.gender == Gender.MALE.name }.count).isEqualTo(1)
        assertThat(row1998.first { it.gender == Gender.FEMALE.name }.count).isEqualTo(1)
    }

    @Test
    fun `일별 신고 수는 한국 시간 날짜로 묶는다`() {
        // given
        val report = reportRepository.saveAndFlush(
            Report(
                reporterId = 1,
                reportedMemberId = 2,
                type = ReportType.PROFILE,
                reason = ReportReason.ABUSE,
            ),
        )
        setCreatedAt("report", report.id, Instant.parse("2026-08-19T16:00:00Z"))

        // when
        val counts = reportAdminRepository.countDailyCreatedSince(Instant.parse("2026-08-19T00:00:00Z"))

        // then
        assertThat(counts.associate { it.day to it.count }[LocalDate.of(2026, 8, 20)]).isEqualTo(1)
    }

    @Test
    fun `정지 중 회원 수는 해제와 만료를 빼고 전화번호 단위로 센다`() {
        // given
        val now = Instant.parse("2026-08-20T00:00:00Z")
        saveSuspension(memberId = 1, expiresAt = now.plusSeconds(3600))
        saveSuspension(memberId = 1, expiresAt = null)
        saveSuspension(memberId = 11, phoneNumber = "+821088881", expiresAt = null)
        saveSuspension(memberId = 2, expiresAt = now.minusSeconds(3600))
        val released = saveSuspension(memberId = 3, expiresAt = null)
        released.releasedAt = now.minusSeconds(60)
        entityManager.flush()

        // when
        val count = suspensionAdminRepository.countSuspendedMembers(now)

        // then
        assertThat(count).isEqualTo(1)
    }

    @Test
    fun `접속 집계는 일별, 기간별, 플랫폼별로 센다`() {
        // given
        val today = LocalDate.of(2026, 8, 20)
        saveAccessLog(memberId = 1, accessedOn = today, platform = DevicePlatform.IOS)
        saveAccessLog(memberId = 1, accessedOn = today.minusDays(1), platform = DevicePlatform.IOS)
        saveAccessLog(memberId = 2, accessedOn = today, platform = DevicePlatform.ANDROID)
        saveAccessLog(memberId = 3, accessedOn = today.minusDays(40), platform = DevicePlatform.IOS)

        // when
        val daily = accessLogAdminRepository.countDailySince(today.minusDays(13))
        val distinct = accessLogAdminRepository.countDistinctMembersSince(today.minusDays(29))
        val platforms = accessLogAdminRepository.countByPlatformSince(today.minusDays(6))
        val versions = accessLogAdminRepository.countByVersionSince(today.minusDays(6))

        // then
        assertThat(daily.associate { it.day to it.count }[today]).isEqualTo(2)
        assertThat(distinct).isEqualTo(2)
        assertThat(platforms.first { it.platform == DevicePlatform.IOS }.count).isEqualTo(1)
        assertThat(platforms.first { it.platform == DevicePlatform.ANDROID }.count).isEqualTo(1)
        assertThat(versions.first { it.platform == DevicePlatform.IOS }.version).isEqualTo("1.8.2")
        assertThat(versions.first { it.platform == DevicePlatform.IOS }.count).isEqualTo(1)
    }

    private fun saveMember(
        phoneNumber: String,
        gender: Gender = Gender.MALE,
        birthYear: Int = 1998,
        role: MemberRole = MemberRole.MEMBER,
    ) = memberRepository.saveAndFlush(
        Member(
            phoneNumber = phoneNumber,
            password = "encoded-password",
            gender = gender,
            nickname = phoneNumber.takeLast(10),
            birthYear = birthYear,
            role = role,
        ),
    )

    private fun saveSuspension(
        memberId: Long,
        expiresAt: Instant?,
        phoneNumber: String = "+82108888$memberId",
    ) = memberSuspensionRepository.saveAndFlush(
        MemberSuspension(
            phoneNumber = phoneNumber,
            memberId = memberId,
            nickname = "회원$memberId",
            type = SuspensionType.SERVICE,
            reason = SuspensionReason.ABUSE,
            startedAt = Instant.parse("2026-08-01T00:00:00Z"),
            expiresAt = expiresAt,
        ),
    )

    private fun saveAccessLog(memberId: Long, accessedOn: LocalDate, platform: DevicePlatform) {
        accessLogRepository.saveAndFlush(
            AccessLog(
                memberId = memberId,
                phoneNumber = "+82108888$memberId",
                platform = platform,
                deviceName = null,
                ipAddress = "127.0.0.1",
                accessedOn = accessedOn,
                appVersion = "1.8.2",
            ),
        )
    }

    private fun setCreatedAt(table: String, id: Long, createdAt: Instant) {
        entityManager.flush()
        entityManager
            .createNativeQuery("update $table set created_at = :createdAt where id = :id")
            .setParameter("createdAt", createdAt)
            .setParameter("id", id)
            .executeUpdate()
        entityManager.clear()
    }
}
