package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.entity.AiReplyBubble
import com.blueoauld.server.domain.ai.repository.AiReplyBubbleRepository
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.service.ChatMessageService
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

class AiReplyBubbleServiceTest {

    private val aiReplyBubbleRepository = mockk<AiReplyBubbleRepository>(relaxed = true)

    private val chatRoomRepository = mockk<ChatRoomRepository>()

    private val chatMessageService = mockk<ChatMessageService>()

    private val service = AiReplyBubbleService(
        aiReplyBubbleRepository,
        chatRoomRepository,
        chatMessageService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `남은 말풍선을 글자 수에 맞춘 1초에서 3초 사이 간격으로 차례로 예약한다`() {
        // when
        service.enqueue(ROOM_ID, AI_ID, listOf("응", "가".repeat(20), "나".repeat(50)))

        // then
        val saved = slot<Iterable<AiReplyBubble>>()
        verify { aiReplyBubbleRepository.saveAll(capture(saved)) }
        val bubbles = saved.captured.toList()
        assertThat(bubbles.map { it.content }).containsExactly("응", "가".repeat(20), "나".repeat(50))
        assertThat(bubbles).allMatch { it.roomId == ROOM_ID && it.aiMemberId == AI_ID }
        assertThat(Duration.between(NOW, bubbles[0].dueAt)).isBetween(seconds(1.0), seconds(1.5))
        assertThat(Duration.between(bubbles[0].dueAt, bubbles[1].dueAt)).isBetween(seconds(2.0), seconds(2.5))
        assertThat(Duration.between(bubbles[1].dueAt, bubbles[2].dueAt)).isBetween(seconds(3.0), seconds(3.5))
    }

    @Test
    fun `방이 있으면 말풍선을 AI 메시지로 보내고 지운다`() {
        // given
        val room = ChatRoom.of(USER_ID, AI_ID)
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
        every { chatMessageService.append(room, AI_ID, any()) } returns response()

        // when
        service.send(bubble(dueAt = NOW))

        // then
        verify { aiReplyBubbleRepository.deleteById(0L) }
        verify {
            chatMessageService.append(
                room,
                AI_ID,
                match { it.senderId == AI_ID && it.type == ChatMessageType.TEXT && it.content == "뭐 하고 있었어?" },
            )
        }
    }

    @Test
    fun `방이 없으면 보내지 않고 지운다`() {
        // given
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.empty()

        // when
        service.send(bubble(dueAt = NOW))

        // then
        verify { aiReplyBubbleRepository.deleteById(0L) }
        verify(exactly = 0) { chatMessageService.append(any(), any(), any()) }
    }

    @Test
    fun `기한보다 10분 넘게 밀린 말풍선은 보내지 않고 지운다`() {
        // given
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(ChatRoom.of(USER_ID, AI_ID))

        // when
        service.send(bubble(dueAt = NOW.minus(Duration.ofMinutes(11))))

        // then
        verify { aiReplyBubbleRepository.deleteById(0L) }
        verify(exactly = 0) { chatMessageService.append(any(), any(), any()) }
    }

    @Test
    fun `버리면 말풍선을 지운다`() {
        // when
        service.drop(bubble(dueAt = NOW))

        // then
        verify { aiReplyBubbleRepository.deleteById(0L) }
    }

    private fun bubble(dueAt: Instant) = AiReplyBubble(
        roomId = ROOM_ID,
        aiMemberId = AI_ID,
        content = "뭐 하고 있었어?",
        dueAt = dueAt,
    )

    private fun response() = ChatMessageResponse(
        messageId = 78L,
        roomId = ROOM_ID,
        senderId = AI_ID,
        type = ChatMessageType.TEXT,
        content = "뭐 하고 있었어?",
        imageUrl = null,
        createdAt = NOW,
    )

    private fun seconds(value: Double): Duration = Duration.ofMillis((value * 1000).toLong())

    companion object {

        private const val ROOM_ID = 0L
        private const val AI_ID = 5L
        private const val USER_ID = 9L
        private val NOW: Instant = Instant.parse("2026-09-19T03:00:00Z")
    }
}
