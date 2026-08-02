package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.event.ChatRoomDeletedEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.*

class ChatRoomServiceTest {

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val room = ChatRoom.of(ME_ID, PARTNER_ID)

    private val chatRoomService = ChatRoomService(
        chatRoomRepository,
        eventPublisher,
    )

    @BeforeEach
    fun setUp() {
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
    }

    @Test
    fun `나가면 방이 소프트 딜리트된다`() {
        // when
        chatRoomService.leave(ME_ID, ROOM_ID)

        // then
        verify { chatRoomRepository.delete(room) }
    }

    @Test
    fun `나가면 상대에게 방이 사라졌다고 알린다`() {
        // given
        val events = mutableListOf<Any>()

        // when
        chatRoomService.leave(ME_ID, ROOM_ID)

        // then
        verify { eventPublisher.publishEvent(capture(events)) }
        val deleted = events.filterIsInstance<ChatRoomDeletedEvent>().single()
        assertThat(deleted.receiverId).isEqualTo(PARTNER_ID)
        assertThat(deleted.roomId).isEqualTo(room.id)
    }

    @Test
    fun `상대와의 방을 지우면 상대에게 알린다`() {
        // given
        every { chatRoomRepository.findByMembers(ME_ID, PARTNER_ID) } returns room
        val events = mutableListOf<Any>()

        // when
        chatRoomService.deleteBetween(ME_ID, PARTNER_ID)

        // then
        verify { chatRoomRepository.delete(room) }
        verify { eventPublisher.publishEvent(capture(events)) }
        assertThat(events.filterIsInstance<ChatRoomDeletedEvent>().single().receiverId).isEqualTo(PARTNER_ID)
    }

    @Test
    fun `상대와의 방이 없으면 아무것도 하지 않는다`() {
        // given
        every { chatRoomRepository.findByMembers(ME_ID, PARTNER_ID) } returns null

        // when
        chatRoomService.deleteBetween(ME_ID, PARTNER_ID)

        // then
        verify(exactly = 0) { chatRoomRepository.delete(any()) }
        verify(exactly = 0) { eventPublisher.publishEvent(any()) }
    }

    @Test
    fun `참여자가 아니면 나갈 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.leave(STRANGER_ID, ROOM_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
        verify(exactly = 0) { chatRoomRepository.delete(any()) }
    }

    @Test
    fun `없는 방은 나갈 수 없다`() {
        // given
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.leave(ME_ID, ROOM_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    companion object {

        private const val ROOM_ID = 10L
        private const val ME_ID = 1L
        private const val PARTNER_ID = 2L
        private const val STRANGER_ID = 3L
    }
}
