package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingDecision
import com.blueoauld.server.domain.ai.dto.projection.AiGreetingCandidateRow
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.entity.type.AiGreetingState
import com.blueoauld.server.domain.ai.repository.AiGreetingJobRepository
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AiGreetingContextServiceTest {

    private val aiGreetingJobRepository = mockk<AiGreetingJobRepository>()

    private val aiPersonaRepository = mockk<AiPersonaRepository>()

    private val memberRepository = mockk<MemberRepository>()

    private val memberSuspensionService = mockk<MemberSuspensionService>()

    private val contactBlockRepository = mockk<ContactBlockRepository>()

    private val member = member(USER_ID, Gender.FEMALE, createdAt = NOW.minus(Duration.ofHours(1)))

    private val ai = member(AI_ID, Gender.MALE, createdAt = NOW.minus(Duration.ofDays(30)))

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(USER_ID) } returns Optional.of(member)
        every { memberRepository.findById(AI_ID) } returns Optional.of(ai)
        every { memberSuspensionService.isSuspended(any(), SuspensionType.SERVICE) } returns false
        every {
            aiGreetingJobRepository.countByStateAndSentAtGreaterThanEqual(AiGreetingState.SENT, DAY_START)
        } returns 0
        every { aiGreetingJobRepository.findNearestAiCandidates(USER_ID, "MALE", 37.5, 127.0, DAY_START, 5) } returns
            listOf(candidate(AI_ID, 1200.0))
        every { contactBlockRepository.existsBetween(AI_ID, USER_ID) } returns false
        every { aiPersonaRepository.findById(AI_ID) } returns Optional.of(persona())
    }

    @Test
    fun `조건이 맞으면 가까운 남자 AI와 거리를 담은 문맥을 준다`() {
        // when
        val decision = service(NOW).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiGreetingDecision.Send::class.java)
        val context = (decision as AiGreetingDecision.Send).context
        assertThat(context.ai).isSameAs(ai)
        assertThat(context.partner).isSameAs(member)
        assertThat(context.systemPrompt).isEqualTo("프롬프트")
        assertThat(context.distanceMeters).isEqualTo(1200.0)
        assertThat(context.now).isEqualTo(NOW)
    }

    @Test
    fun `회원이 탈퇴했으면 버린다`() {
        // given
        every { memberRepository.findById(USER_ID) } returns Optional.empty()

        // when
        val decision = service(NOW).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiGreetingDecision.Drop::class.java)
    }

    @Test
    fun `가입 후 3일이 지났으면 버린다`() {
        // given
        every { memberRepository.findById(USER_ID) } returns
            Optional.of(member(USER_ID, Gender.FEMALE, createdAt = NOW.minus(Duration.ofDays(4))))

        // when
        val decision = service(NOW).decide(job())

        // then
        assertThat((decision as AiGreetingDecision.Drop).reason).contains("3일")
    }

    @Test
    fun `쪽지 수신을 껐으면 버린다`() {
        // given
        every { member.noteReceiveEnabled } returns false

        // when
        val decision = service(NOW).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiGreetingDecision.Drop::class.java)
    }

    @Test
    fun `정지 중이면 버린다`() {
        // given
        every { memberSuspensionService.isSuspended(USER_ID, SuspensionType.SERVICE) } returns true

        // when
        val decision = service(NOW).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiGreetingDecision.Drop::class.java)
    }

    @Test
    fun `아직 앱을 켜지 않아 위치 갱신 시각이 없으면 한 시간 뒤로 미룬다`() {
        // given
        every { member.locatedAt } returns null

        // when
        val decision = service(NOW).decide(job())

        // then
        assertThat(decision).isEqualTo(AiGreetingDecision.Postpone(NOW.plus(Duration.ofHours(1))))
    }

    @Test
    fun `위치를 끈 회원이면 거리 없이 무작위 AI 중에서 고른다`() {
        // given
        every { member.latitude } returns null
        every { member.longitude } returns null
        every { aiGreetingJobRepository.findRandomAiCandidates(USER_ID, "MALE", DAY_START, 5) } returns listOf(AI_ID)

        // when
        val decision = service(NOW).decide(job())

        // then
        val context = (decision as AiGreetingDecision.Send).context
        assertThat(context.ai).isSameAs(ai)
        assertThat(context.distanceMeters).isNull()
        verify(exactly = 0) {
            aiGreetingJobRepository.findNearestAiCandidates(any(), any(), any(), any(), any(), any())
        }
    }

    @Test
    fun `전체 하루 인사 한도에 닿으면 내일로 미룬다`() {
        // given
        every {
            aiGreetingJobRepository.countByStateAndSentAtGreaterThanEqual(AiGreetingState.SENT, DAY_START)
        } returns AiGreetingContextService.GLOBAL_DAILY_LIMIT

        // when
        val decision = service(NOW).decide(job())

        // then
        val tomorrow = DAY_START.plus(Duration.ofDays(1))
        assertThat((decision as AiGreetingDecision.Postpone).dueAt)
            .isBetween(tomorrow.plus(Duration.ofMinutes(10)), tomorrow.plus(Duration.ofHours(2)))
    }

    @Test
    fun `정지 중이거나 번호 차단 관계인 AI는 건너뛰고 남는 AI가 없으면 한 시간 뒤로 미룬다`() {
        // given
        every { aiGreetingJobRepository.findNearestAiCandidates(USER_ID, "MALE", 37.5, 127.0, DAY_START, 5) } returns
            listOf(candidate(AI_ID, 1200.0), candidate(OTHER_AI_ID, 3400.0))
        every { memberSuspensionService.isSuspended(AI_ID, SuspensionType.SERVICE) } returns true
        every { contactBlockRepository.existsBetween(OTHER_AI_ID, USER_ID) } returns true

        // when
        val decision = service(NOW).decide(job())

        // then
        assertThat(decision).isEqualTo(AiGreetingDecision.Postpone(NOW.plus(Duration.ofHours(1))))
    }

    @Test
    fun `고른 AI가 활동 시간 밖이면 다음 활동 시작 이후로 미룬다`() {
        // when
        val decision = service(NIGHT).decide(job())

        // then
        val start = Instant.parse("2026-09-15T08:00:00+09:00")
        assertThat((decision as AiGreetingDecision.Postpone).dueAt)
            .isBetween(start.plusSeconds(10), start.plusSeconds(180))
    }

    private fun service(now: Instant) = AiGreetingContextService(
        aiGreetingJobRepository,
        aiPersonaRepository,
        memberRepository,
        memberSuspensionService,
        contactBlockRepository,
        Clock.fixed(now, ZoneOffset.UTC),
    )

    private fun job() = AiGreetingJob(memberId = USER_ID, dueAt = NOW)

    private fun persona() = AiPersona(memberId = AI_ID, systemPrompt = "프롬프트", nextLocationRefreshAt = NOW)

    private fun candidate(aiMemberId: Long, distanceMeters: Double) = object : AiGreetingCandidateRow {
        override val aiMemberId = aiMemberId
        override val distanceMeters = distanceMeters
    }

    private fun member(memberId: Long, gender: Gender, createdAt: Instant) = mockk<Member> {
        every { id } returns memberId
        every { this@mockk.gender } returns gender
        every { this@mockk.createdAt } returns createdAt
        every { noteReceiveEnabled } returns true
        every { latitude } returns 37.5
        every { longitude } returns 127.0
        every { locatedAt } returns createdAt
    }

    companion object {

        private const val USER_ID = 9L
        private const val AI_ID = 5L
        private const val OTHER_AI_ID = 6L

        private val NOW: Instant = Instant.parse("2026-09-15T12:30:00+09:00")
        private val NIGHT: Instant = Instant.parse("2026-09-15T03:00:00+09:00")
        private val DAY_START: Instant = Instant.parse("2026-09-15T00:00:00+09:00")
    }
}
