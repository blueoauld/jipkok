package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.request.SendMessageRequest
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.util.*

class ChatMessageServiceTest {

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val chatRoomMemberRepository = mockk<ChatRoomMemberRepository>(relaxed = true)

    private val chatMessageRepository = mockk<ChatMessageRepository>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val chatMessageService = ChatMessageService(
        chatRoomRepository,
        chatRoomMemberRepository,
        chatMessageRepository,
        photoUploadService,
        photoStorage,
        eventPublisher,
    )

    private val room = ChatRoom.of(ME_ID, PARTNER_ID)

    @BeforeEach
    fun setUp() {
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
        every { chatMessageRepository.save(any()) } answers { firstArg() }
        every { photoStorage.createSignedViewUrl(any()) } returns SIGNED_URL
    }

    @Test
    fun `글 메시지를 보내면 내용이 남는다`() {
        // when
        val response = chatMessageService.send(ME_ID, ROOM_ID, text("안녕하세요."))

        // then
        assertThat(response.type).isEqualTo(ChatMessageType.TEXT)
        assertThat(response.content).isEqualTo("안녕하세요.")
        assertThat(response.imageUrl).isNull()
    }

    @Test
    fun `사진 메시지는 서명된 URL을 준다`() {
        // when
        val response = chatMessageService.send(ME_ID, ROOM_ID, photo(OBJECT_KEY))

        // then
        assertThat(response.type).isEqualTo(ChatMessageType.PHOTO)
        assertThat(response.imageUrl).isEqualTo(SIGNED_URL)
        verify { photoUploadService.confirm(listOf(OBJECT_KEY)) }
    }

    @Test
    fun `메시지를 보내면 상대의 안읽음 수가 올라간다`() {
        // when
        chatMessageService.send(ME_ID, ROOM_ID, text("안녕하세요."))

        // then
        verify { chatRoomMemberRepository.increaseUnreadCount(room.id, PARTNER_ID) }
    }

    @Test
    fun `메시지를 보내면 상대에게 전달할 이벤트가 발행된다`() {
        // given
        val event = slot<ChatMessageSentEvent>()

        // when
        chatMessageService.send(ME_ID, ROOM_ID, text("안녕하세요."))

        // then
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.receiverId).isEqualTo(PARTNER_ID)
        assertThat(event.captured.message.content).isEqualTo("안녕하세요.")
    }

    @Test
    fun `빈 글 메시지는 보낼 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, text("   "))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REQUEST)
        verify(exactly = 0) { chatMessageRepository.save(any()) }
    }

    @Test
    fun `남의 사진 키로는 보낼 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, photo("chats/$PARTNER_ID/a.jpg"))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
    }

    @Test
    fun `사진 키가 없으면 사진 메시지를 보낼 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, photo(null))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
    }

    @Test
    fun `참여자가 아니면 보낼 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(STRANGER_ID, ROOM_ID, text("안녕하세요."))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    @Test
    fun `없는 방에는 보낼 수 없다`() {
        // given
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, text("안녕하세요."))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    private fun text(content: String) = SendMessageRequest(type = ChatMessageType.TEXT, content = content)

    private fun photo(objectKey: String?) = SendMessageRequest(type = ChatMessageType.PHOTO, objectKey = objectKey)

    companion object {

        private const val ROOM_ID = 10L
        private const val ME_ID = 1L
        private const val PARTNER_ID = 2L
        private const val STRANGER_ID = 3L

        private const val OBJECT_KEY = "chats/$ME_ID/a.jpg"
        private const val SIGNED_URL = "https://r2.example.com/chats/1/a.jpg?signature=x"
    }
}
