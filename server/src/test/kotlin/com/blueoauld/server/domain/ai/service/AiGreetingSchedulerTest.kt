package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiGreetingDecision
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class AiGreetingSchedulerTest {

    private val aiGreetingJobService = mockk<AiGreetingJobService>(relaxed = true)

    private val aiGreetingContextService = mockk<AiGreetingContextService>()

    private val aiReplyGenerator = mockk<AiReplyGenerator>()

    private val context = mockk<AiGreetingContext>()

    private val scheduler = AiGreetingScheduler(
        aiGreetingJobService,
        aiGreetingContextService,
        aiReplyGenerator,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    private val job = AiGreetingJob(memberId = 9L, dueAt = NOW)

    @BeforeEach
    fun setUp() {
        every { aiGreetingJobService.findDue(NOW) } returns listOf(job)
    }

    @Test
    fun `보낼 수 있으면 만든 첫 쪽지로 완료한다`() {
        // given
        every { aiGreetingContextService.decide(job) } returns AiGreetingDecision.Send(context)
        every { aiReplyGenerator.greet(context) } returns REPLY

        // when
        scheduler.run()

        // then
        verify { aiGreetingJobService.complete(job, context, REPLY) }
    }

    @Test
    fun `생성 결과가 비어 있으면 작업을 버린다`() {
        // given
        every { aiGreetingContextService.decide(job) } returns AiGreetingDecision.Send(context)
        every { aiReplyGenerator.greet(context) } returns null

        // when
        scheduler.run()

        // then
        verify { aiGreetingJobService.drop(job, any()) }
        verify(exactly = 0) { aiGreetingJobService.complete(any(), any(), any()) }
    }

    @Test
    fun `미루라고 하면 그 시각으로 미루고 버리라고 하면 이유와 함께 버린다`() {
        // given
        val later = NOW.plusSeconds(3600)
        val other = AiGreetingJob(memberId = 10L, dueAt = NOW)
        every { aiGreetingJobService.findDue(NOW) } returns listOf(job, other)
        every { aiGreetingContextService.decide(job) } returns AiGreetingDecision.Postpone(later)
        every { aiGreetingContextService.decide(other) } returns AiGreetingDecision.Drop("정지 중이다.")

        // when
        scheduler.run()

        // then
        verify { aiGreetingJobService.postpone(job, later) }
        verify { aiGreetingJobService.drop(other, "정지 중이다.") }
    }

    @Test
    fun `쪽지를 보낼 수 없는 업무 예외면 재시도 없이 에러 코드를 이유로 버린다`() {
        // given
        every { aiGreetingContextService.decide(job) } returns AiGreetingDecision.Send(context)
        every { aiReplyGenerator.greet(context) } returns REPLY
        every { aiGreetingJobService.complete(job, context, REPLY) } throws BusinessException(ErrorCode.NOTE_BLOCKED)

        // when
        scheduler.run()

        // then
        verify { aiGreetingJobService.drop(job, "NOTE_BLOCKED") }
        verify(exactly = 0) { aiGreetingJobService.fail(any()) }
    }

    @Test
    fun `그 밖의 예외면 실패로 기록해 재시도한다`() {
        // given
        every { aiGreetingContextService.decide(job) } returns AiGreetingDecision.Send(context)
        every { aiReplyGenerator.greet(context) } throws IllegalStateException("timeout")

        // when
        scheduler.run()

        // then
        verify { aiGreetingJobService.fail(job) }
        verify(exactly = 0) { aiGreetingJobService.drop(any(), any()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-15T03:30:00Z")
        private val REPLY = AiReply("안녕하세요", promptTokens = 10, completionTokens = 5, model = "gpt")
    }
}
