package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.type.AiGreetingState
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.ai.repository.AiGreetingJobRepository
import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.service.ChatNoteService
import com.blueoauld.server.domain.member.entity.Member
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AiGreetingJobServiceTest {

    private val aiGreetingJobRepository = mockk<AiGreetingJobRepository>(relaxed = true)

    private val aiReplyLogRepository = mockk<AiReplyLogRepository>(relaxed = true)

    private val chatNoteService = mockk<ChatNoteService>()

    private val service = AiGreetingJobService(
        aiGreetingJobRepository,
        aiReplyLogRepository,
        chatNoteService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    private val ai = mockk<Member> { every { id } returns AI_ID }

    private val member = mockk<Member> { every { id } returns USER_ID }

    @Test
    fun `가입 후 10분이 지난 회원을 찾아 10분에서 2시간 사이 시각으로 예약한다`() {
        // given
        every {
            aiGreetingJobRepository.findCandidates(
                NOW.minus(Duration.ofDays(3)),
                NOW.minus(Duration.ofMinutes(10)),
                50,
            )
        } returns listOf(USER_ID)

        // when
        val scheduled = service.schedule()

        // then
        assertThat(scheduled).isEqualTo(1)
        verify {
            aiGreetingJobRepository.insertIfAbsent(
                USER_ID,
                match { it >= NOW.plus(Duration.ofMinutes(10)) && it <= NOW.plus(Duration.ofHours(2)) },
                NOW,
            )
        }
    }

    @Test
    fun `완료하면 AI가 쪽지를 보내고 로그를 남기고 작업을 보냄으로 표시한다`() {
        // given
        val job = job()
        every { aiGreetingJobRepository.findById(USER_ID) } returns Optional.of(job)
        every { chatNoteService.send(AI_ID, USER_ID, "안녕하세요") } returns response(roomId = 3L, messageId = 77L)
        every { aiReplyLogRepository.save(any()) } answers { firstArg() }
        val log = slot<AiReplyLog>()

        // when
        service.complete(job, context(), reply("안녕하세요"))

        // then
        verify { aiReplyLogRepository.save(capture(log)) }
        assertThat(log.captured.kind).isEqualTo(AiReplyKind.GREETING)
        assertThat(log.captured.aiMemberId).isEqualTo(AI_ID)
        assertThat(log.captured.roomId).isEqualTo(3L)
        assertThat(log.captured.messageId).isEqualTo(77L)
        assertThat(job.state).isEqualTo(AiGreetingState.SENT)
        assertThat(job.aiMemberId).isEqualTo(AI_ID)
        assertThat(job.roomId).isEqualTo(3L)
        assertThat(job.sentAt).isEqualTo(NOW)
    }

    @Test
    fun `미루면 기한만 바뀐다`() {
        // given
        val job = job()
        every { aiGreetingJobRepository.findById(USER_ID) } returns Optional.of(job)

        // when
        service.postpone(job, NOW.plus(Duration.ofHours(1)))

        // then
        assertThat(job.dueAt).isEqualTo(NOW.plus(Duration.ofHours(1)))
        assertThat(job.state).isEqualTo(AiGreetingState.PENDING)
    }

    @Test
    fun `실패하면 5분 뒤 재시도하고 세 번째 실패에는 버린다`() {
        // given
        val first = job()
        val last = job().apply { attempts = AiGreetingJob.MAX_ATTEMPTS - 1 }
        every { aiGreetingJobRepository.findById(USER_ID) } returns Optional.of(first) andThen Optional.of(last)

        // when
        service.fail(first)
        service.fail(last)

        // then
        assertThat(first.attempts).isEqualTo(1)
        assertThat(first.dueAt).isEqualTo(NOW.plus(Duration.ofMinutes(5)))
        assertThat(first.state).isEqualTo(AiGreetingState.PENDING)
        assertThat(last.state).isEqualTo(AiGreetingState.DROPPED)
    }

    @Test
    fun `버리면 이유와 함께 버림으로 표시한다`() {
        // given
        val job = job()
        every { aiGreetingJobRepository.findById(USER_ID) } returns Optional.of(job)

        // when
        service.drop(job, "NOTE_BLOCKED")

        // then
        assertThat(job.state).isEqualTo(AiGreetingState.DROPPED)
        assertThat(job.droppedReason).isEqualTo("NOTE_BLOCKED")
    }

    private fun job() = AiGreetingJob(memberId = USER_ID, dueAt = NOW)

    private fun context() = AiGreetingContext(ai, "프롬프트", member, NOW, 1200.0)

    private fun reply(content: String) = AiReply(
        content,
        promptTokens = 10,
        completionTokens = 5,
        cachedTokens = 0,
        model = "gpt",
    )

    private fun response(roomId: Long, messageId: Long) = ChatMessageResponse(
        messageId = messageId,
        roomId = roomId,
        senderId = AI_ID,
        type = ChatMessageType.TEXT,
        content = "안녕하세요",
        imageUrl = null,
        createdAt = NOW,
    )

    companion object {

        private const val USER_ID = 9L
        private const val AI_ID = 5L

        private val NOW: Instant = Instant.parse("2026-09-15T12:30:00+09:00")
    }
}
