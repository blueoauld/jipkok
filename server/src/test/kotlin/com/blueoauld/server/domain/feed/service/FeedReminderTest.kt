package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.dto.projection.FeedReminderTarget
import com.blueoauld.server.domain.feed.repository.FeedReminderRepository
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.push.service.PushMessages
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

    private val feedReminderRepository = mockk<FeedReminderRepository>(relaxed = true)

    private val pushService = mockk<PushService>(relaxed = true)

    private val pushMessages = mockk<PushMessages>()

    private val feedReminder = FeedReminder(
        feedReminderRepository,
        pushService,
        pushMessages,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `직전 알림 뒤로 올리지 않은 회원에게 보낸다`() {
        // given
        every { feedReminderRepository.findFeedReminderTargets(SINCE, NOW) } returns
            listOf(target(1L, MemberLocale.KO))
        every { pushMessages.get(MemberLocale.KO, any()) } returns "문구"

        // when
        feedReminder.remind()

        // then
        verify {
            pushService.sendAll(
                listOf(1L),
                "문구",
                "문구",
                FeedReminder.DATA,
                FeedReminder.COLLAPSE_KEY,
                FeedReminder.CHANNEL_ID,
                PushService.PRIORITY_HIGH,
            )
        }
    }

    @Test
    fun `정각보다 늦게 돌아도 직전 알림 정각 슬롯부터 올린 회원을 뺀다`() {
        // given
        val lateNow = Instant.parse("2026-08-03T05:00:00.004Z")
        val lateReminder = FeedReminder(
            feedReminderRepository,
            pushService,
            pushMessages,
            Clock.fixed(lateNow, ZoneOffset.UTC),
        )

        // when
        lateReminder.remind()

        // then
        verify { feedReminderRepository.findFeedReminderTargets(SINCE, lateNow) }
    }

    @Test
    fun `언어가 다르면 나눠 보낸다`() {
        // given
        every { feedReminderRepository.findFeedReminderTargets(SINCE, NOW) } returns listOf(
            target(1L, MemberLocale.KO),
            target(2L, MemberLocale.JA),
            target(3L, MemberLocale.KO),
        )
        every { pushMessages.get(MemberLocale.KO, any()) } returns "한국어"
        every { pushMessages.get(MemberLocale.JA, any()) } returns "일본어"

        // when
        feedReminder.remind()

        // then
        verify {
            pushService.sendAll(listOf(1L, 3L), "한국어", "한국어", any(), any(), any(), any())
            pushService.sendAll(listOf(2L), "일본어", "일본어", any(), any(), any(), any())
        }
    }

    @Test
    fun `문구는 시간마다 달라진다`() {
        // when
        val codes = (0..23).map { hour -> FeedReminder.bodyCodeOf(NOW.plus(hour.toLong(), ChronoUnit.HOURS)) }

        // then
        assertThat(codes.toSet()).hasSize(FeedReminder.BODY_COUNT)
        assertThat(codes.zipWithNext().none { (a, b) -> a == b }).isTrue()
    }

    @Test
    fun `보낼 회원이 없으면 아무것도 하지 않는다`() {
        // given
        every { feedReminderRepository.findFeedReminderTargets(any(), any()) } returns emptyList()

        // when
        feedReminder.remind()

        // then
        verify(exactly = 0) { pushService.sendAll(any(), any(), any(), any(), any(), any(), any()) }
    }

    private fun target(memberId: Long, locale: MemberLocale) = object : FeedReminderTarget {
        override fun getMemberId() = memberId

        override fun getLocale() = locale
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-03T05:00:30Z")
        private val SINCE: Instant = Instant.parse("2026-08-03T02:00:00Z")
    }
}
