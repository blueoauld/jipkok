package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.projection.AiNudgeCandidateRow
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.AiReplyJobRepository
import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.service.ChatMessageService
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import io.mockk.verifyOrder
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AiReplyJobServiceTest {

    private val aiReplyJobRepository = mockk<AiReplyJobRepository>(relaxed = true)

    private val aiReplyLogRepository = mockk<AiReplyLogRepository>(relaxed = true)

    private val aiPersonaRepository = mockk<AiPersonaRepository>()

    private val chatRoomRepository = mockk<ChatRoomRepository>()

    private val chatRoomMemberRepository = mockk<ChatRoomMemberRepository>(relaxed = true)

    private val chatMessageService = mockk<ChatMessageService>()

    private val service = AiReplyJobService(
        aiReplyJobRepository,
        aiReplyLogRepository,
        aiPersonaRepository,
        chatRoomRepository,
        chatRoomMemberRepository,
        chatMessageService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `받는 사람이 AI면 응답 지연 범위 안의 시각으로 작업을 올린다`() {
        // given
        every { aiPersonaRepository.findById(AI_ID) } returns Optional.of(persona(enabled = true))
        every { aiPersonaRepository.existsById(USER_ID) } returns false

        // when
        service.schedule(event(receiverId = AI_ID, senderId = USER_ID))

        // then
        verify {
            aiReplyJobRepository.upsert(
                ROOM_ID,
                AI_ID,
                MESSAGE_ID,
                match { it >= NOW.plusSeconds(10) && it <= NOW.plusSeconds(20) },
                NOW,
            )
        }
    }

    @Test
    fun `받는 사람이 AI가 아니면 아무것도 하지 않는다`() {
        // given
        every { aiPersonaRepository.findById(USER_ID) } returns Optional.empty()

        // when
        service.schedule(event(receiverId = USER_ID, senderId = AI_ID))

        // then
        verify(exactly = 0) { aiReplyJobRepository.upsert(any(), any(), any(), any(), any()) }
    }

    @Test
    fun `비활성 페르소나면 작업을 올리지 않는다`() {
        // given
        every { aiPersonaRepository.findById(AI_ID) } returns Optional.of(persona(enabled = false))

        // when
        service.schedule(event(receiverId = AI_ID, senderId = USER_ID))

        // then
        verify(exactly = 0) { aiReplyJobRepository.upsert(any(), any(), any(), any(), any()) }
    }

    @Test
    fun `보낸 사람도 AI면 작업을 올리지 않는다`() {
        // given
        every { aiPersonaRepository.findById(AI_ID) } returns Optional.of(persona(enabled = true))
        every { aiPersonaRepository.existsById(USER_ID) } returns true

        // when
        service.schedule(event(receiverId = AI_ID, senderId = USER_ID))

        // then
        verify(exactly = 0) { aiReplyJobRepository.upsert(any(), any(), any(), any(), any()) }
    }

    @Test
    fun `완료하면 답한 메시지까지 읽음 처리하고 답장과 로그를 남긴 뒤 같은 메시지 기준의 작업만 지운다`() {
        // given
        val room = ChatRoom.of(USER_ID, AI_ID)
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
        every { chatMessageService.append(room, AI_ID, any()) } returns response(messageId = 77L, senderId = AI_ID)
        every { aiReplyLogRepository.save(any()) } answers { firstArg() }

        // when
        service.complete(job(), context(), reply())

        // then
        verifyOrder {
            chatRoomMemberRepository.markRead(room.id, AI_ID, MESSAGE_ID)
            chatMessageService.append(
                room,
                AI_ID,
                match { it.senderId == AI_ID && it.type == ChatMessageType.TEXT && it.content == "안녕!" },
            )
            aiReplyLogRepository.save(
                match {
                    it.aiMemberId == AI_ID &&
                        it.messageId == 77L &&
                        it.promptTokens == 120 &&
                        it.completionTokens == 8 &&
                        it.model == "test-model" &&
                        it.language == MemberLocale.KO &&
                        !it.regenerated
                },
            )
            aiReplyJobRepository.deleteIfUnchanged(ROOM_ID, MESSAGE_ID)
        }
    }

    @Test
    fun `답하지 않기로 했으면 받은 메시지까지 읽음 처리하고 무응답 로그만 남긴 뒤 작업을 지운다`() {
        // given
        every { aiReplyLogRepository.save(any()) } answers { firstArg() }

        // when
        service.skip(job(), context(), reply().copy(content = AiPromptBuilder.NO_REPLY, skipped = true))

        // then
        verifyOrder {
            chatRoomMemberRepository.markRead(ROOM_ID, AI_ID, MESSAGE_ID)
            aiReplyLogRepository.save(
                match {
                    it.kind == AiReplyKind.SKIP &&
                        it.messageId == MESSAGE_ID &&
                        it.promptTokens == 120 &&
                        it.completionTokens == 8 &&
                        it.language == MemberLocale.KO
                },
            )
            aiReplyJobRepository.deleteIfUnchanged(ROOM_ID, MESSAGE_ID)
        }
        verify(exactly = 0) { chatMessageService.append(any(), any(), any()) }
    }

    @Test
    fun `언어가 어긋나 다시 만든 답이면 로그에 표시한다`() {
        // given
        val room = ChatRoom.of(USER_ID, AI_ID)
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
        every { chatMessageService.append(room, AI_ID, any()) } returns response(messageId = 79L, senderId = AI_ID)
        every { aiReplyLogRepository.save(any()) } answers { firstArg() }

        // when
        service.complete(job(), context(), reply().copy(regenerated = true))

        // then
        verify { aiReplyLogRepository.save(match { it.regenerated }) }
    }

    @Test
    fun `말 걸기 후보 방마다 한 시간 안의 기한으로 작업을 넣는다`() {
        // given
        every {
            aiReplyJobRepository.findNudgeCandidates(
                NOW.minus(AiReplyJobService.NUDGE_WINDOW),
                NOW.minus(AiReplyJobService.NUDGE_AFTER),
                AiReplyJobService.NUDGE_BATCH_SIZE,
            )
        } returns listOf(candidate())

        // when
        val scheduled = service.scheduleNudges()

        // then
        assertThat(scheduled).isEqualTo(1)
        verify {
            aiReplyJobRepository.insertNudgeIfAbsent(
                ROOM_ID,
                AI_ID,
                MESSAGE_ID,
                match { it >= NOW && it <= NOW.plus(AiReplyJobService.NUDGE_SPREAD) },
                NOW,
            )
        }
    }

    @Test
    fun `말 걸기 작업을 완료하면 로그에 종류가 남는다`() {
        // given
        val room = ChatRoom.of(USER_ID, AI_ID)
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
        every { chatMessageService.append(room, AI_ID, any()) } returns response(messageId = 78L, senderId = AI_ID)
        every { aiReplyLogRepository.save(any()) } answers { firstArg() }

        // when
        service.complete(job(kind = AiReplyKind.NUDGE), context(), reply())

        // then
        verify { aiReplyLogRepository.save(match { it.kind == AiReplyKind.NUDGE && it.messageId == 78L }) }
    }

    @Test
    fun `방이 없으면 답장 없이 작업을 지운다`() {
        // given
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.empty()

        // when
        service.complete(job(), context(), reply())

        // then
        verify(exactly = 0) { chatMessageService.append(any(), any(), any()) }
        verify { aiReplyJobRepository.deleteById(ROOM_ID) }
    }

    @Test
    fun `실패하면 시도 횟수를 올리고 5분 뒤로 미루되 마지막 시도였으면 지운다`() {
        // when
        service.fail(job(attempts = 0))
        service.fail(job(attempts = AiReplyJob.MAX_ATTEMPTS - 1))

        // then
        verify { aiReplyJobRepository.retry(ROOM_ID, NOW.plus(AiReplyJob.RETRY_DELAY), NOW) }
        verify { aiReplyJobRepository.deleteById(ROOM_ID) }
    }

    private fun event(receiverId: Long, senderId: Long) =
        ChatMessageSentEvent(receiverId, response(MESSAGE_ID, senderId))

    private fun response(messageId: Long, senderId: Long) = ChatMessageResponse(
        messageId = messageId,
        roomId = ROOM_ID,
        senderId = senderId,
        type = ChatMessageType.TEXT,
        content = "안녕",
        imageUrl = null,
        createdAt = NOW,
    )

    private fun context() = mockk<AiReplyContext> {
        every { lastMessageId } returns MESSAGE_ID
        every { language } returns MemberLocale.KO
    }

    private fun reply() = AiReply(
        content = "안녕!",
        promptTokens = 120,
        completionTokens = 8,
        cachedTokens = 0,
        model = "test-model",
    )

    private fun persona(enabled: Boolean) = AiPersona(
        memberId = AI_ID,
        enabled = enabled,
        systemPrompt = "프롬프트",
        replyDelayMinSeconds = 10,
        replyDelayMaxSeconds = 20,
        nextLocationRefreshAt = NOW,
    )

    private fun job(attempts: Int = 0, kind: AiReplyKind = AiReplyKind.REPLY) = AiReplyJob(
        roomId = ROOM_ID,
        aiMemberId = AI_ID,
        lastMessageId = MESSAGE_ID,
        dueAt = NOW,
        attempts = attempts,
        kind = kind,
    )

    private fun candidate() = object : AiNudgeCandidateRow {
        override val roomId = ROOM_ID
        override val aiMemberId = AI_ID
        override val lastMessageId = MESSAGE_ID
    }

    companion object {

        private const val ROOM_ID = 0L
        private const val AI_ID = 5L
        private const val USER_ID = 9L
        private const val MESSAGE_ID = 40L
        private val NOW: Instant = Instant.parse("2026-09-15T03:00:00Z")
    }
}
