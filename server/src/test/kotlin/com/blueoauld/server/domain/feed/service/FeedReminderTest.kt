package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.service.PushService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit

class FeedReminderTest {

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val pushService = mockk<PushService>(relaxed = true)

    private val feedReminder = FeedReminder(
        memberRepository,
        pushService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `이번 시간에 올리지 않은 회원에게 보낸다`() {
        // given
        every { memberRepository.findFeedReminderTargets(SLOT_AT, NOW) } returns TARGETS

        // when
        feedReminder.remind()

        // then
        verify {
            pushService.sendAll(TARGETS, FeedReminder.TITLE, FeedReminder.bodyOf(NOW), FeedReminder.COLLAPSE_KEY)
        }
    }

    @Test
    fun `문구는 시간마다 달라진다`() {
        // when
        val bodies = (0..23).map { hour -> FeedReminder.bodyOf(NOW.plus(hour.toLong(), ChronoUnit.HOURS)) }

        // then
        assertThat(bodies.toSet()).hasSize(FeedReminder.BODIES.size)
        assertThat(bodies.zipWithNext().none { (a, b) -> a == b }).isTrue()
    }

    @Test
    fun `보낼 회원이 없으면 아무것도 하지 않는다`() {
        // given
        every { memberRepository.findFeedReminderTargets(any(), any()) } returns emptyList()

        // when
        feedReminder.remind()

        // then
        verify(exactly = 0) { pushService.sendAll(any(), any(), any(), any()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-03T05:00:30Z")
        private val SLOT_AT: Instant = Instant.parse("2026-08-03T05:00:00Z")

        private val TARGETS = listOf(1L, 2L)
    }
}
