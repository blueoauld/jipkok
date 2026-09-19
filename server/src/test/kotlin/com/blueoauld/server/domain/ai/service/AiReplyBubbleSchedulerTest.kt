package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.entity.AiReplyBubble
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class AiReplyBubbleSchedulerTest {

    private val aiReplyBubbleService = mockk<AiReplyBubbleService>(relaxed = true)

    private val scheduler = AiReplyBubbleScheduler(aiReplyBubbleService, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `기한이 된 말풍선을 차례로 보내고 실패한 것은 버린 뒤 다음으로 넘어간다`() {
        // given
        val failing = bubble("첫째")
        val next = bubble("둘째")
        every { aiReplyBubbleService.findDue(NOW) } returns listOf(failing, next)
        every { aiReplyBubbleService.send(failing) } throws IllegalStateException("장애")

        // when
        scheduler.run()

        // then
        verify { aiReplyBubbleService.drop(failing) }
        verify { aiReplyBubbleService.send(next) }
        verify(exactly = 0) { aiReplyBubbleService.drop(next) }
    }

    private fun bubble(content: String) = AiReplyBubble(roomId = 1L, aiMemberId = 5L, content = content, dueAt = NOW)

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-19T03:00:00Z")
    }
}
