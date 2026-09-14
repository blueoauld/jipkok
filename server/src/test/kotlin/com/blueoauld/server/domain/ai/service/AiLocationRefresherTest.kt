package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.repository.MemberRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class AiLocationRefresherTest {

    private val aiPersonaRepository = mockk<AiPersonaRepository>()

    private val memberRepository = mockk<MemberRepository>()

    @Test
    fun `활동 시간이면 위치 갱신 시각을 지금으로 바꾸고 다음 갱신을 20분에서 3시간 뒤로 잡는다`() {
        // given
        val now = Instant.parse("2026-09-15T12:00:00+09:00")
        val persona = persona()
        val member = member()
        every { aiPersonaRepository.findAllByEnabledTrueAndNextLocationRefreshAtLessThanEqual(now) } returns
            listOf(persona)
        every { memberRepository.findAllById(listOf(MEMBER_ID)) } returns listOf(member)

        // when
        refresher(now).refresh()

        // then
        assertThat(member.locatedAt).isEqualTo(now)
        assertThat(persona.nextLocationRefreshAt).isBetween(
            now.plus(AiPersona.LOCATION_REFRESH_MIN_INTERVAL),
            now.plus(AiPersona.LOCATION_REFRESH_MAX_INTERVAL),
        )
    }

    @Test
    fun `활동 시간이 아니면 위치는 두고 다음 활동 시작 뒤 3시간 안으로 미룬다`() {
        // given
        val now = Instant.parse("2026-09-15T03:00:00+09:00")
        val persona = persona()
        val member = member()
        every { aiPersonaRepository.findAllByEnabledTrueAndNextLocationRefreshAtLessThanEqual(now) } returns
            listOf(persona)
        every { memberRepository.findAllById(listOf(MEMBER_ID)) } returns listOf(member)

        // when
        refresher(now).refresh()

        // then
        val start = Instant.parse("2026-09-15T08:00:00+09:00")
        assertThat(member.locatedAt).isNull()
        assertThat(persona.nextLocationRefreshAt).isBetween(start, start.plus(AiPersona.LOCATION_REFRESH_MAX_INTERVAL))
    }

    @Test
    fun `갱신할 페르소나가 없으면 회원을 조회하지 않는다`() {
        // given
        val now = Instant.parse("2026-09-15T12:00:00+09:00")
        every { aiPersonaRepository.findAllByEnabledTrueAndNextLocationRefreshAtLessThanEqual(now) } returns
            emptyList()

        // when
        refresher(now).refresh()

        // then
        verify(exactly = 0) { memberRepository.findAllById(any()) }
    }

    private fun refresher(now: Instant) =
        AiLocationRefresher(aiPersonaRepository, memberRepository, Clock.fixed(now, ZoneOffset.UTC))

    private fun persona() = AiPersona(
        memberId = MEMBER_ID,
        systemPrompt = "프롬프트",
        nextLocationRefreshAt = Instant.EPOCH,
    )

    private fun member() = Member(
        phoneNumber = "AI-0000000000000",
        password = "encoded",
        gender = Gender.FEMALE,
        nickname = "루나",
        birthYear = 1998,
        role = MemberRole.AI,
        latitude = 37.5,
        longitude = 127.0,
    )

    companion object {

        private const val MEMBER_ID = 0L
    }
}
