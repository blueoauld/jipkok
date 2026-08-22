package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.request.ReactMessageRequest
import com.blueoauld.server.domain.chat.dto.request.SendMessageRequest
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatMessageReaction
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.entity.type.ChatReactionType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.event.ChatReactionChangedEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageReactionRepository
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.StoredObject
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
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
import org.springframework.data.domain.Limit
import java.util.*

class ChatMessageServiceTest {

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val chatRoomMemberRepository = mockk<ChatRoomMemberRepository>(relaxed = true)

    private val chatMessageRepository = mockk<ChatMessageRepository>(relaxed = true)

    private val chatMessageReactionRepository = mockk<ChatMessageReactionRepository>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val chatMessageService = ChatMessageService(
        chatRoomRepository,
        chatRoomMemberRepository,
        chatMessageRepository,
        chatMessageReactionRepository,
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
    fun `영상 메시지는 영상과 썸네일 URL, 길이를 준다`() {
        // given
        every { photoStorage.head(VIDEO_KEY) } returns StoredObject(10L * 1024 * 1024, "video/mp4")

        // when
        val response = chatMessageService.send(ME_ID, ROOM_ID, video(VIDEO_KEY, THUMBNAIL_KEY, 120))

        // then
        assertThat(response.type).isEqualTo(ChatMessageType.VIDEO)
        assertThat(response.videoUrl).isEqualTo(SIGNED_URL)
        assertThat(response.thumbnailUrl).isEqualTo(SIGNED_URL)
        assertThat(response.imageUrl).isNull()
        assertThat(response.durationSeconds).isEqualTo(120)
        verify { photoUploadService.confirm(listOf(VIDEO_KEY, THUMBNAIL_KEY)) }
    }

    @Test
    fun `영상이 상한보다 크면 지우고 거절한다`() {
        // given
        every { photoStorage.head(VIDEO_KEY) } returns
            StoredObject(ChatMessage.VIDEO_MAX_BYTES + 1, "video/mp4")

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, video(VIDEO_KEY, THUMBNAIL_KEY, 120))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.VIDEO_TOO_LARGE)
        verify { photoStorage.delete(listOf(VIDEO_KEY)) }
        verify(exactly = 0) { chatMessageRepository.save(any()) }
    }

    @Test
    fun `영상이 5분을 넘으면 보낼 수 없다`() {
        // given
        every { photoStorage.head(VIDEO_KEY) } returns StoredObject(1024, "video/mp4")

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, video(VIDEO_KEY, THUMBNAIL_KEY, ChatMessage.VIDEO_MAX_SECONDS + 1))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.VIDEO_TOO_LONG)
    }

    @Test
    fun `올라오지 않은 영상 키로는 보낼 수 없다`() {
        // given
        every { photoStorage.head(VIDEO_KEY) } returns null

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, video(VIDEO_KEY, THUMBNAIL_KEY, 10))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
    }

    @Test
    fun `종류를 알 수 없는 파일이 올라와 있으면 보낼 수 없다`() {
        // given
        every { photoStorage.head(VIDEO_KEY) } returns StoredObject(1024, null)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, video(VIDEO_KEY, THUMBNAIL_KEY, 10))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
    }

    @Test
    fun `영상이 아닌 파일이 올라와 있으면 보낼 수 없다`() {
        // given
        every { photoStorage.head(VIDEO_KEY) } returns StoredObject(1024, "image/jpeg")

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, video(VIDEO_KEY, THUMBNAIL_KEY, 10))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
    }

    @Test
    fun `영상 메시지의 재생 URL을 새로 발급한다`() {
        // given
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.of(videoMessage())

        // when
        val response = chatMessageService.findVideoUrl(ME_ID, ROOM_ID, REPLY_ID)

        // then
        assertThat(response.url).isEqualTo(SIGNED_URL)
        verify { photoStorage.createSignedViewUrl(VIDEO_KEY) }
    }

    @Test
    fun `영상이 아닌 메시지의 재생 URL은 발급하지 않는다`() {
        // given
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.of(original())

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.findVideoUrl(ME_ID, ROOM_ID, REPLY_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.NOT_VIDEO_MESSAGE)
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
    fun `메시지를 보내면 방과 방 멤버에 마지막 메시지를 옮기고 상대의 안읽음 수를 올린다`() {
        // when
        val response = chatMessageService.send(ME_ID, ROOM_ID, text("안녕하세요."))

        // then
        assertThat(room.lastMessageId).isEqualTo(response.messageId)
        verify { chatRoomMemberRepository.applyLastMessage(room.id, response.messageId, PARTNER_ID) }
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
    fun `응답에 클라이언트 메시지 id가 담긴다`() {
        // given
        every { chatMessageRepository.findByRoomIdAndClientMessageId(ROOM_ID, CLIENT_MESSAGE_ID) } returns null

        // when
        val response = chatMessageService.send(ME_ID, ROOM_ID, text("안녕하세요.", CLIENT_MESSAGE_ID))

        // then
        assertThat(response.clientMessageId).isEqualTo(CLIENT_MESSAGE_ID)
    }

    @Test
    fun `같은 클라이언트 메시지 id로 다시 보내면 저장 없이 기존 메시지를 준다`() {
        // given
        val existing = ChatMessage(
            roomId = ROOM_ID,
            senderId = ME_ID,
            type = ChatMessageType.TEXT,
            content = "안녕하세요.",
            clientMessageId = CLIENT_MESSAGE_ID,
        )
        every { chatMessageRepository.findByRoomIdAndClientMessageId(ROOM_ID, CLIENT_MESSAGE_ID) } returns existing

        // when
        val response = chatMessageService.send(ME_ID, ROOM_ID, text("안녕하세요.", CLIENT_MESSAGE_ID))

        // then
        assertThat(response.clientMessageId).isEqualTo(CLIENT_MESSAGE_ID)
        verify(exactly = 0) { chatMessageRepository.save(any()) }
        verify(exactly = 0) { eventPublisher.publishEvent(any()) }
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
    fun `답글로 보내면 원문이 함께 담긴다`() {
        // given
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.of(original())

        // when
        val response = chatMessageService.send(ME_ID, ROOM_ID, reply("좋아요!", REPLY_ID))

        // then
        assertThat(response.content).isEqualTo("좋아요!")
        assertThat(response.replyMessage?.messageId).isEqualTo(REPLY_ID)
        assertThat(response.replyMessage?.content).isEqualTo("원문입니다.")
        assertThat(response.replyMessage?.senderId).isEqualTo(PARTNER_ID)
        assertThat(response.replyMessage?.previewUrl).isNull()
    }

    @Test
    fun `영상에 답글을 달면 썸네일을 미리보기로 준다`() {
        // given
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.of(videoMessage())

        // when
        val response = chatMessageService.send(ME_ID, ROOM_ID, reply("멋지다", REPLY_ID))

        // then
        assertThat(response.replyMessage?.type).isEqualTo(ChatMessageType.VIDEO)
        assertThat(response.replyMessage?.previewUrl).isEqualTo(SIGNED_URL)
        verify { photoStorage.createSignedViewUrl(THUMBNAIL_KEY) }
    }

    @Test
    fun `다른 방의 메시지에는 답글을 달 수 없다`() {
        // given
        every { chatMessageRepository.findById(REPLY_ID) } returns
            Optional.of(original(roomId = ROOM_ID + 1))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, reply("좋아요!", REPLY_ID))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.REPLY_TARGET_NOT_FOUND)
    }

    @Test
    fun `없는 메시지에는 답글을 달 수 없다`() {
        // given
        every { chatMessageRepository.findById(REPLY_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.send(ME_ID, ROOM_ID, reply("좋아요!", REPLY_ID))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.REPLY_TARGET_NOT_FOUND)
    }

    @Test
    fun `목록에서도 답글 원문을 함께 준다`() {
        // given
        val replyMessage = ChatMessage(
            roomId = ROOM_ID,
            senderId = ME_ID,
            type = ChatMessageType.TEXT,
            content = "좋아요!",
            replyToMessageId = REPLY_ID,
        )
        every {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(any(), any(), any())
        } returns listOf(replyMessage)
        every { chatMessageRepository.findAllById(listOf(REPLY_ID)) } returns listOf(original())

        // when
        val response = chatMessageService.findMessages(ME_ID, ROOM_ID, cursor = null, size = 30)

        // then
        val item = response.items.single()

        assertThat(item.replyMessage?.messageId).isEqualTo(REPLY_ID)
        assertThat(item.replyMessage?.content).isEqualTo("원문입니다.")
    }

    @Test
    fun `메시지 목록은 최근 메시지부터 준다`() {
        // given
        every {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(any(), any(), any())
        } returns listOf(message(ChatMessageType.TEXT, content = "안녕하세요."))

        // when
        val response = chatMessageService.findMessages(ME_ID, ROOM_ID, cursor = null, size = 30)

        // then
        verify {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(ROOM_ID, Long.MAX_VALUE, Limit.of(30))
        }
        assertThat(response.items.single().content).isEqualTo("안녕하세요.")
        assertThat(response.nextCursor).isNull()
    }

    @Test
    fun `목록의 사진도 서명된 URL을 준다`() {
        // given
        every {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(any(), any(), any())
        } returns listOf(message(ChatMessageType.PHOTO, objectKey = OBJECT_KEY))

        // when
        val response = chatMessageService.findMessages(ME_ID, ROOM_ID, cursor = null, size = 30)

        // then
        assertThat(response.items.single().imageUrl).isEqualTo(SIGNED_URL)
    }

    @Test
    fun `참여자가 아니면 목록을 볼 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.findMessages(STRANGER_ID, ROOM_ID, cursor = null, size = 30)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    @Test
    fun `읽음 처리하면 안읽음 수가 다시 계산된다`() {
        // when
        chatMessageService.markRead(ME_ID, ROOM_ID, LAST_READ_MESSAGE_ID)

        // then
        verify { chatRoomMemberRepository.markRead(ROOM_ID, ME_ID, LAST_READ_MESSAGE_ID) }
    }

    @Test
    fun `여러 방을 한 번에 읽음 처리한다`() {
        // when
        chatMessageService.markAllRead(ME_ID, listOf(ROOM_ID, ANOTHER_ROOM_ID))

        // then
        verify { chatRoomMemberRepository.markAllRead(ME_ID, listOf(ROOM_ID, ANOTHER_ROOM_ID)) }
    }

    @Test
    fun `읽음 처리할 방이 없으면 조회하지 않는다`() {
        // when
        chatMessageService.markAllRead(ME_ID, emptyList())

        // then
        verify(exactly = 0) { chatRoomMemberRepository.markAllRead(any(), any()) }
    }

    @Test
    fun `참여자가 아니면 읽음 처리할 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.markRead(STRANGER_ID, ROOM_ID, LAST_READ_MESSAGE_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
        verify(exactly = 0) { chatRoomMemberRepository.markRead(any(), any(), any()) }
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
        val response = chatMessageService.react(ME_ID, ROOM_ID, REPLY_ID, ReactMessageRequest(ChatReactionType.HEART))

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
        chatMessageService.react(ME_ID, ROOM_ID, REPLY_ID, ReactMessageRequest(ChatReactionType.LAUGH))

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
        val response = chatMessageService.unreact(ME_ID, ROOM_ID, REPLY_ID)

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
            chatMessageService.react(ME_ID, ROOM_ID, REPLY_ID, ReactMessageRequest(ChatReactionType.HEART))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_MESSAGE_NOT_FOUND)
        verify(exactly = 0) { chatMessageReactionRepository.save(any()) }
    }

    @Test
    fun `참여자가 아니면 반응할 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatMessageService.react(STRANGER_ID, ROOM_ID, REPLY_ID, ReactMessageRequest(ChatReactionType.HEART))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    @Test
    fun `목록에 각 메시지의 반응이 함께 담긴다`() {
        // given
        val message = original()
        every {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(ROOM_ID, Long.MAX_VALUE, Limit.of(30))
        } returns listOf(message)
        every { chatMessageReactionRepository.findByMessageIdIn(listOf(REPLY_ID)) } returns
            listOf(reaction(ME_ID, ChatReactionType.HEART), reaction(PARTNER_ID, ChatReactionType.LIKE))

        // when
        val response = chatMessageService.findMessages(ME_ID, ROOM_ID, null, 30)

        // then
        assertThat(response.items.single().reactions).extracting("memberId", "type")
            .containsExactly(tuple(ME_ID, ChatReactionType.HEART), tuple(PARTNER_ID, ChatReactionType.LIKE))
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

    private fun message(type: ChatMessageType, content: String? = null, objectKey: String? = null) = ChatMessage(
        roomId = ROOM_ID,
        senderId = ME_ID,
        type = type,
        content = content,
        objectKey = objectKey,
    )

    private fun text(content: String, clientMessageId: String? = null) = SendMessageRequest(
        type = ChatMessageType.TEXT,
        content = content,
        clientMessageId = clientMessageId,
    )

    private fun reply(content: String, replyToMessageId: Long) = SendMessageRequest(
        type = ChatMessageType.TEXT,
        content = content,
        replyToMessageId = replyToMessageId,
    )

    private fun original(roomId: Long = ROOM_ID, id: Long = REPLY_ID): ChatMessage {
        val message = ChatMessage(
            roomId = roomId,
            senderId = PARTNER_ID,
            type = ChatMessageType.TEXT,
            content = "원문입니다.",
        )
        ChatMessage::class.java.getDeclaredField("id").apply {
            isAccessible = true
            set(message, id)
        }
        return message
    }

    private fun reaction(memberId: Long, type: ChatReactionType) = ChatMessageReaction(
        roomId = ROOM_ID,
        messageId = REPLY_ID,
        memberId = memberId,
        type = type,
    )

    private fun photo(objectKey: String?) = SendMessageRequest(type = ChatMessageType.PHOTO, objectKey = objectKey)

    private fun video(objectKey: String, thumbnailKey: String, durationSeconds: Int) = SendMessageRequest(
        type = ChatMessageType.VIDEO,
        objectKey = objectKey,
        thumbnailKey = thumbnailKey,
        durationSeconds = durationSeconds,
    )

    private fun videoMessage() = ChatMessage(
        roomId = ROOM_ID,
        senderId = PARTNER_ID,
        type = ChatMessageType.VIDEO,
        objectKey = VIDEO_KEY,
        thumbnailObjectKey = THUMBNAIL_KEY,
        durationSeconds = 30,
    )

    companion object {

        private const val ROOM_ID = 10L
        private const val ANOTHER_ROOM_ID = 11L
        private const val ME_ID = 1L
        private const val PARTNER_ID = 2L
        private const val STRANGER_ID = 3L
        private const val LAST_READ_MESSAGE_ID = 99L
        private const val REPLY_ID = 7L

        private const val CLIENT_MESSAGE_ID = "client-1"

        private const val OBJECT_KEY = "chats/$ME_ID/a.jpg"
        private const val VIDEO_KEY = "chats/$ME_ID/v.mp4"
        private const val THUMBNAIL_KEY = "chats/$ME_ID/t.jpg"
        private const val SIGNED_URL = "https://r2.example.com/chats/1/a.jpg?signature=x"
    }
}
