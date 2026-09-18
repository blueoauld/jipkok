package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiReplyDecision
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class AiReplySchedulerTest {

    private val aiReplyJobService = mockk<AiReplyJobService>(relaxed = true)

    private val aiReplyContextService = mockk<AiReplyContextService>()

    private val aiReplyGenerator = mockk<AiReplyGenerator>()

    private val aiMemoryService = mockk<AiMemoryService>(relaxed = true)

    private val context = mockk<AiReplyContext>()

    private val scheduler = AiReplyScheduler(
        aiReplyJobService,
        aiReplyContextService,
        aiReplyGenerator,
        aiMemoryService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    private val job = AiReplyJob(roomId = 1L, aiMemberId = 5L, lastMessageId = 40L, dueAt = NOW)

    @BeforeEach
    fun setUp() {
        every { aiReplyJobService.findDue(NOW) } returns listOf(job)
    }

    @Test
    fun `답할 수 있으면 생성한 내용으로 완료한다`() {
        // given
        every { aiReplyContextService.decide(job) } returns AiReplyDecision.Reply(context)
        every { aiReplyGenerator.generate(context) } returns REPLY

        // when
        scheduler.run()

        // then
        verify { aiReplyJobService.complete(job, context, REPLY) }
        verify { aiMemoryService.refreshIfNeeded(1L, context) }
    }

    @Test
    fun `생성 결과가 비어 있으면 작업을 버린다`() {
        // given
        every { aiReplyContextService.decide(job) } returns AiReplyDecision.Reply(context)
        every { aiReplyGenerator.generate(context) } returns null

        // when
        scheduler.run()

        // then
        verify { aiReplyJobService.drop(job) }
        verify(exactly = 0) { aiReplyJobService.complete(any(), any(), any()) }
        verify(exactly = 0) { aiMemoryService.refreshIfNeeded(any(), any()) }
    }

    @Test
    fun `미루라고 하면 그 시각으로 미룬다`() {
        // given
        every { aiReplyContextService.decide(job) } returns AiReplyDecision.Postpone(NOW.plusSeconds(600))

        // when
        scheduler.run()

        // then
        verify { aiReplyJobService.postpone(job, NOW.plusSeconds(600)) }
    }

    @Test
    fun `생성 중 예외가 나면 실패 처리하고 다음 작업으로 넘어간다`() {
        // given
        val next = AiReplyJob(roomId = 2L, aiMemberId = 5L, lastMessageId = 41L, dueAt = NOW)
        every { aiReplyJobService.findDue(NOW) } returns listOf(job, next)
        every { aiReplyContextService.decide(job) } returns AiReplyDecision.Reply(context)
        every { aiReplyContextService.decide(next) } returns AiReplyDecision.Drop("이유")
        every { aiReplyGenerator.generate(context) } throws IllegalStateException("장애")

        // when
        scheduler.run()

        // then
        verify { aiReplyJobService.fail(job) }
        verify { aiReplyJobService.drop(next) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-15T03:00:00Z")
        private val REPLY = AiReply(
            content = "안녕!",
            promptTokens = 100,
            completionTokens = 5,
            cachedTokens = 0,
            model = null,
        )
    }
}
