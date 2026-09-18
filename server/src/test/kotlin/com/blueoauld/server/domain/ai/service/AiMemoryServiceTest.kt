package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.AiRoomMemory
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.ai.repository.AiRoomMemoryRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

class AiMemoryServiceTest {

    private val aiRoomMemoryRepository = mockk<AiRoomMemoryRepository>()

    private val aiReplyLogRepository = mockk<AiReplyLogRepository>()

    private val chatMessageRepository = mockk<ChatMessageRepository>()

    private val aiReplyGenerator = mockk<AiReplyGenerator>()

    private val service = AiMemoryService(
        aiRoomMemoryRepository,
        aiReplyLogRepository,
        chatMessageRepository,
        aiReplyGenerator,
    )

    private val ai = mockk<Member> { every { id } returns AI_ID }

    private val partner = mockk<Member> { every { id } returns USER_ID }

    @BeforeEach
    fun setUp() {
        every { aiRoomMemoryRepository.save(any()) } answers { firstArg() }
        every { aiReplyLogRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `요약한 뒤 20건이 안 쌓였으면 아무것도 하지 않는다`() {
        // given
        every { aiRoomMemoryRepository.findById(ROOM_ID) } returns Optional.of(memory(summarizedMessageId = 10L))
        every { chatMessageRepository.countByRoomIdAndIdGreaterThan(ROOM_ID, 10L) } returns 19

        // when
        service.refreshIfNeeded(ROOM_ID, context())

        // then
        verify(exactly = 0) { aiReplyGenerator.summarize(any()) }
    }

    @Test
    fun `기억이 없고 20건이 쌓였으면 처음부터 요약해 저장하고 로그를 남긴다`() {
        // given
        every { aiRoomMemoryRepository.findById(ROOM_ID) } returns Optional.empty()
        every { chatMessageRepository.countByRoomIdAndIdGreaterThan(ROOM_ID, 0L) } returns 20
        every { chatMessageRepository.findByRoomIdAndIdGreaterThanOrderByIdDesc(ROOM_ID, 0L, any()) } returns
            listOf(message(22L), message(21L))
        val summaryContext = slot<AiSummaryContext>()
        every { aiReplyGenerator.summarize(capture(summaryContext)) } returns REPLY
        val saved = slot<AiRoomMemory>()
        every { aiRoomMemoryRepository.save(capture(saved)) } answers { firstArg() }

        // when
        service.refreshIfNeeded(ROOM_ID, context())

        // then
        assertThat(summaryContext.captured.previousSummary).isNull()
        assertThat(summaryContext.captured.messages.map { it.id }).containsExactly(21L, 22L)
        assertThat(saved.captured.summary).isEqualTo("상대는 부산에 산다.")
        assertThat(saved.captured.summarizedMessageId).isEqualTo(22L)
        verify {
            aiReplyLogRepository.save(
                match<AiReplyLog> { it.kind == AiReplyKind.SUMMARY && it.messageId == 22L && it.promptTokens == 300 },
            )
        }
    }

    @Test
    fun `기억이 있으면 이전 요약을 넘기고 같은 행을 갱신한다`() {
        // given
        val memory = memory(summarizedMessageId = 10L)
        every { aiRoomMemoryRepository.findById(ROOM_ID) } returns Optional.of(memory)
        every { chatMessageRepository.countByRoomIdAndIdGreaterThan(ROOM_ID, 10L) } returns 25
        every { chatMessageRepository.findByRoomIdAndIdGreaterThanOrderByIdDesc(ROOM_ID, 10L, any()) } returns
            listOf(message(35L), message(34L))
        val summaryContext = slot<AiSummaryContext>()
        every { aiReplyGenerator.summarize(capture(summaryContext)) } returns REPLY

        // when
        service.refreshIfNeeded(ROOM_ID, context())

        // then
        assertThat(summaryContext.captured.previousSummary).isEqualTo("옛 요약")
        assertThat(memory.summary).isEqualTo("상대는 부산에 산다.")
        assertThat(memory.summarizedMessageId).isEqualTo(35L)
        verify { aiRoomMemoryRepository.save(memory) }
    }

    @Test
    fun `요약을 만들지 못하면 저장하지 않고 예외도 삼킨다`() {
        // given
        every { aiRoomMemoryRepository.findById(ROOM_ID) } returns Optional.empty()
        every { chatMessageRepository.countByRoomIdAndIdGreaterThan(ROOM_ID, 0L) } returns 20
        every { chatMessageRepository.findByRoomIdAndIdGreaterThanOrderByIdDesc(ROOM_ID, 0L, any()) } returns
            listOf(message(21L))
        every { aiReplyGenerator.summarize(any()) } returns null andThenThrows IllegalStateException("장애")

        // when
        service.refreshIfNeeded(ROOM_ID, context())
        service.refreshIfNeeded(ROOM_ID, context())

        // then
        verify(exactly = 0) { aiRoomMemoryRepository.save(any()) }
    }

    private fun context() = AiReplyContext(
        ai = ai,
        systemPrompt = "프롬프트",
        partner = partner,
        messages = listOf(message(1L)),
        language = MemberLocale.KO,
        now = Instant.EPOCH,
    )

    private fun memory(summarizedMessageId: Long) = AiRoomMemory(ROOM_ID, AI_ID, "옛 요약", summarizedMessageId)

    private fun message(messageId: Long) = mockk<ChatMessage> {
        every { id } returns messageId
    }

    companion object {

        private const val ROOM_ID = 3L
        private const val AI_ID = 5L
        private const val USER_ID = 9L
        private val REPLY = AiReply(
            content = "상대는 부산에 산다.",
            promptTokens = 300,
            completionTokens = 40,
            cachedTokens = 0,
            model = "m",
        )
    }
}
