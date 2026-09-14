package com.blueoauld.server.domain.ai.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant

class AiPersonaTest {

    @Test
    fun `자정을 넘기는 활동 시간은 시작 이후와 끝 이전 모두 활동 중이다`() {
        // given
        val persona = persona(activeStartHour = 8, activeEndHour = 1)

        // when, then
        assertThat(persona.isActiveAt(Instant.parse("2026-09-14T23:30:00+09:00"))).isTrue()
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T00:30:00+09:00"))).isTrue()
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T01:00:00+09:00"))).isFalse()
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T07:59:00+09:00"))).isFalse()
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T08:00:00+09:00"))).isTrue()
    }

    @Test
    fun `같은 날 안에 끝나는 활동 시간은 그 사이만 활동 중이다`() {
        // given
        val persona = persona(activeStartHour = 9, activeEndHour = 18)

        // when, then
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T08:59:00+09:00"))).isFalse()
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T09:00:00+09:00"))).isTrue()
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T17:59:00+09:00"))).isTrue()
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T18:00:00+09:00"))).isFalse()
    }

    @Test
    fun `시작과 끝이 같으면 하루 종일 활동 중이다`() {
        // given
        val persona = persona(activeStartHour = 0, activeEndHour = 0)

        // when, then
        assertThat(persona.isActiveAt(Instant.parse("2026-09-15T03:00:00+09:00"))).isTrue()
    }

    @Test
    fun `다음 활동 시작은 오늘 시작 시각이 지났으면 내일이다`() {
        // given
        val persona = persona(activeStartHour = 8, activeEndHour = 1)

        // when
        val beforeStart = persona.nextActiveStart(Instant.parse("2026-09-15T03:00:00+09:00"))
        val afterStart = persona.nextActiveStart(Instant.parse("2026-09-15T08:00:00+09:00"))

        // then
        assertThat(beforeStart).isEqualTo(Instant.parse("2026-09-15T08:00:00+09:00"))
        assertThat(afterStart).isEqualTo(Instant.parse("2026-09-16T08:00:00+09:00"))
    }

    private fun persona(activeStartHour: Int, activeEndHour: Int) = AiPersona(
        memberId = 1L,
        systemPrompt = "프롬프트",
        activeStartHour = activeStartHour,
        activeEndHour = activeEndHour,
        nextLocationRefreshAt = Instant.EPOCH,
    )
}
