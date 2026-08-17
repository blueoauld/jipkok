package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.response.ChatEventResponse
import com.blueoauld.server.domain.chat.dto.response.ChatEventType
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.dto.response.ChatReactionsResponse
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.event.ChatReactionChangedEvent
import com.blueoauld.server.domain.chat.event.ChatRoomDeletedEvent
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.time.Instant

class ChatEventPublisherTest {

    private val messagingTemplate = mockk<SimpMessagingTemplate>(relaxed = true)

    private val publisher = ChatEventPublisher(messagingTemplate)

    @Test
    fun `새 메시지는 받는 쪽의 큐로 보낸다`() {
        // given
        val event = slot<ChatEventResponse>()

        // when
        publisher.publishMessage(ChatMessageSentEvent(RECEIVER_ID, message()))

        // then
        verify {
            messagingTemplate.convertAndSendToUser("$RECEIVER_ID", ChatEventPublisher.DESTINATION, capture(event))
        }
        assertThat(event.captured.type).isEqualTo(ChatEventType.MESSAGE)
        assertThat(event.captured.roomId).isEqualTo(ROOM_ID)
        assertThat(event.captured.message?.messageId).isEqualTo(MESSAGE_ID)
    }

    @Test
    fun `반응 변경은 메시지 없이 반응 목록만 보낸다`() {
        // given
        val event = slot<ChatEventResponse>()
        val reactions = ChatReactionsResponse(MESSAGE_ID, emptyList())

        // when
        publisher.publishReaction(ChatReactionChangedEvent(RECEIVER_ID, ROOM_ID, reactions))

        // then
        verify {
            messagingTemplate.convertAndSendToUser("$RECEIVER_ID", ChatEventPublisher.DESTINATION, capture(event))
        }
        assertThat(event.captured.type).isEqualTo(ChatEventType.REACTION)
        assertThat(event.captured.reaction).isEqualTo(reactions)
        assertThat(event.captured.message).isNull()
    }

    @Test
    fun `방 삭제는 방 id만 보낸다`() {
        // given
        val event = slot<ChatEventResponse>()

        // when
        publisher.publishRoomDeleted(ChatRoomDeletedEvent(RECEIVER_ID, ROOM_ID))

        // then
        verify {
            messagingTemplate.convertAndSendToUser("$RECEIVER_ID", ChatEventPublisher.DESTINATION, capture(event))
        }
        assertThat(event.captured.type).isEqualTo(ChatEventType.ROOM_DELETED)
        assertThat(event.captured.roomId).isEqualTo(ROOM_ID)
    }

    @Test
    fun `전송에 실패해도 예외를 밖으로 던지지 않는다`() {
        // given
        every { messagingTemplate.convertAndSendToUser(any(), any(), any<Any>()) } throws
            IllegalStateException("broker down")

        // when, then
        assertDoesNotThrow { publisher.publishRoomDeleted(ChatRoomDeletedEvent(RECEIVER_ID, ROOM_ID)) }
    }

    private fun message() = ChatMessageResponse(
        messageId = MESSAGE_ID,
        roomId = ROOM_ID,
        senderId = SENDER_ID,
        type = ChatMessageType.TEXT,
        content = "안녕",
        imageUrl = null,
        createdAt = Instant.parse("2026-08-01T00:00:00Z"),
    )

    companion object {

        private const val ROOM_ID = 10L
        private const val MESSAGE_ID = 100L
        private const val SENDER_ID = 1L
        private const val RECEIVER_ID = 2L
    }
}
