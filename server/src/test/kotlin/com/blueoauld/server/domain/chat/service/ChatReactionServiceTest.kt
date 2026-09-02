package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.request.ReactMessageRequest
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatMessageReaction
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.entity.type.ChatReactionType
import com.blueoauld.server.domain.chat.event.ChatReactionChangedEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageReactionRepository
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.tuple
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.*

class ChatReactionServiceTest {

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val chatMessageRepository = mockk<ChatMessageRepository>(relaxed = true)

    private val chatMessageReactionRepository = mockk<ChatMessageReactionRepository>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val chatReactionService = ChatReactionService(
        chatRoomRepository,
        chatMessageRepository,
        chatMessageReactionRepository,
        eventPublisher,
    )

    @BeforeEach
    fun setUp() {
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(ChatRoom.of(ME_ID, PARTNER_ID))
    }

    @Test
    fun `메시지에 처음 반응하면 저장되고 상대에게 이벤트가 간다`() {
        // given
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.of(original())
        every { chatMessageReactionRepository.findByMessageIdAndMemberId(REPLY_ID, ME_ID) } returns null
        every { chatMessageReactionRepository.save(any()) } answers { firstArg() }
        every { chatMessageReactionRepository.findByMessageId(REPLY_ID) } returns
            listOf(reaction(ME_ID, ChatReactionType.HEART))
        val event = slot<ChatReactionChangedEvent>()

        // when
        val response = chatReactionService.react(ME_ID, ROOM_ID, REPLY_ID, ReactMessageRequest(ChatReactionType.HEART))

        // then
        val saved = slot<ChatMessageReaction>()
        verify { chatMessageReactionRepository.save(capture(saved)) }
        assertThat(saved.captured.roomId).isEqualTo(ROOM_ID)
        assertThat(saved.captured.type).isEqualTo(ChatReactionType.HEART)
        assertThat(response.messageId).isEqualTo(REPLY_ID)
        assertThat(response.reactions).extracting("memberId", "type")
            .containsExactly(tuple(ME_ID, ChatReactionType.HEART))
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.receiverId).isEqualTo(PARTNER_ID)
        assertThat(event.captured.roomId).isEqualTo(ROOM_ID)
        assertThat(event.captured.reactions).isEqualTo(response)
    }

    @Test
    fun `이미 반응한 메시지에 다시 반응하면 종류만 바뀐다`() {
        // given
        val existing = reaction(ME_ID, ChatReactionType.HEART)
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.of(original())
        every { chatMessageReactionRepository.findByMessageIdAndMemberId(REPLY_ID, ME_ID) } returns existing

        // when
        chatReactionService.react(ME_ID, ROOM_ID, REPLY_ID, ReactMessageRequest(ChatReactionType.LAUGH))

        // then
        assertThat(existing.type).isEqualTo(ChatReactionType.LAUGH)
        verify(exactly = 0) { chatMessageReactionRepository.save(any()) }
    }

    @Test
    fun `반응을 취소하면 지워지고 남은 반응을 준다`() {
        // given
        val mine = reaction(ME_ID, ChatReactionType.HEART)
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.of(original())
        every { chatMessageReactionRepository.findByMessageIdAndMemberId(REPLY_ID, ME_ID) } returns mine
        every { chatMessageReactionRepository.findByMessageId(REPLY_ID) } returns
            listOf(reaction(PARTNER_ID, ChatReactionType.LIKE))

        // when
        val response = chatReactionService.unreact(ME_ID, ROOM_ID, REPLY_ID)

        // then
        verify { chatMessageReactionRepository.delete(mine) }
        assertThat(response.reactions).extracting("memberId").containsExactly(PARTNER_ID)
        verify { eventPublisher.publishEvent(any<ChatReactionChangedEvent>()) }
    }

    @Test
    fun `다른 방의 메시지에는 반응할 수 없다`() {
        // given
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.of(original(roomId = ANOTHER_ROOM_ID))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatReactionService.react(ME_ID, ROOM_ID, REPLY_ID, ReactMessageRequest(ChatReactionType.HEART))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_MESSAGE_NOT_FOUND)
        verify(exactly = 0) { chatMessageReactionRepository.save(any()) }
    }

    @Test
    fun `참여자가 아니면 반응할 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatReactionService.react(STRANGER_ID, ROOM_ID, REPLY_ID, ReactMessageRequest(ChatReactionType.HEART))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    private fun original(roomId: Long = ROOM_ID) = ChatMessage(
        roomId = roomId,
        senderId = PARTNER_ID,
        type = ChatMessageType.TEXT,
        content = "안녕하세요",
    ).also { message ->
        ChatMessage::class.java.getDeclaredField("id").apply {
            isAccessible = true
            set(message, REPLY_ID)
        }
    }

    private fun reaction(memberId: Long, type: ChatReactionType) = ChatMessageReaction(
        roomId = ROOM_ID,
        messageId = REPLY_ID,
        memberId = memberId,
        type = type,
    )

    companion object {

        private const val ROOM_ID = 10L
        private const val ANOTHER_ROOM_ID = 11L
        private const val REPLY_ID = 5L
        private const val ME_ID = 1L
        private const val PARTNER_ID = 2L
        private const val STRANGER_ID = 3L
    }
}
