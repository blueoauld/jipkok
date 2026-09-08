package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.projection.AdminChatRoomRow
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.ChatRoomAdminRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.data.domain.Limit
import java.time.Instant

class AdminChatServiceTest {

    private val chatRoomAdminRepository = mockk<ChatRoomAdminRepository>()

    private val chatMessageRepository = mockk<ChatMessageRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val photoStorage = mockk<PhotoStorage>()

    private val adminActionRecorder = mockk<AdminActionRecorder>(relaxed = true)

    private val adminChatService = AdminChatService(
        chatRoomAdminRepository,
        chatMessageRepository,
        memberAdminService,
        photoStorage,
        adminActionRecorder,
    )

    @Test
    fun `방 목록은 두 회원의 닉네임과 마지막 메시지를 채우고 메시지 없는 방은 비워 둔다`() {
        // given
        val withMessage = room(id = 10, partnerId = PARTNER_ID, lastMessageId = 100)
        val deleted = room(id = 11, partnerId = OTHER_ID, lastMessageId = 0, deletedAt = NOW)
        every { chatRoomAdminRepository.findAllForAdmin(null, ME_ID, 20, 0) } returns
            listOf(withMessage, deleted)
        every { chatRoomAdminRepository.countForAdmin(null, ME_ID) } returns 2
        every { chatMessageRepository.findAllById(listOf(100L)) } returns
            listOf(message(id = 100, type = ChatMessageType.TEXT, content = "안녕"))
        every { memberAdminService.findNicknames(listOf(ME_ID, PARTNER_ID, ME_ID, OTHER_ID)) } returns
            mapOf(ME_ID to "구름빵", PARTNER_ID to "밤산책", OTHER_ID to "알 수 없음")

        // when
        val response = adminChatService.findRooms(null, ME_ID, 1, 20)

        // then
        assertThat(response.totalCount).isEqualTo(2)
        assertThat(response.items.map { it.low.nickname to it.high.nickname })
            .containsExactly("구름빵" to "밤산책", "구름빵" to "알 수 없음")
        assertThat(response.items[0].lastMessageContent).isEqualTo("안녕")
        assertThat(response.items[0].lastMessageType).isEqualTo(ChatMessageType.TEXT)
        assertThat(response.items[0].deletedAt).isNull()
        assertThat(response.items[1].lastMessageType).isNull()
        assertThat(response.items[1].lastMessageAt).isNull()
        assertThat(response.items[1].deletedAt).isEqualTo(NOW)
    }

    @Test
    fun `방 상세는 두 회원을 낮은 id부터 주고 삭제 시각을 같이 주며 열람을 기록한다`() {
        // given
        every { chatRoomAdminRepository.findRowById(ROOM_ID) } returns room(id = ROOM_ID, deletedAt = NOW)
        every { memberAdminService.findNicknames(listOf(ME_ID, PARTNER_ID)) } returns
            mapOf(ME_ID to "구름빵", PARTNER_ID to "밤산책")

        // when
        val response = adminChatService.findRoom(ACTOR_ID, ROOM_ID)

        // then
        assertThat(response.members.map { it.id to it.nickname })
            .containsExactly(ME_ID to "구름빵", PARTNER_ID to "밤산책")
        assertThat(response.deletedAt).isEqualTo(NOW)
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.VIEW_CHAT_ROOM, ROOM_ID) }
    }

    @Test
    fun `없는 방을 열면 기록하지 않는다`() {
        // given
        every { chatRoomAdminRepository.findRowById(ROOM_ID) } returns null

        // when

        // then
        assertThatThrownBy { adminChatService.findRoom(ACTOR_ID, ROOM_ID) }
            .isInstanceOf(BusinessException::class.java)
        verify(exactly = 0) { adminActionRecorder.record(any(), any(), any(), any()) }
    }

    @Test
    fun `없는 방이면 예외를 던진다`() {
        // given
        every { chatRoomAdminRepository.findRowById(ROOM_ID) } returns null

        // when

        // then
        assertThatThrownBy { adminChatService.findMessages(ROOM_ID, null, 50) }
            .isInstanceOf(BusinessException::class.java)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    @Test
    fun `메시지는 시간순으로 돌려주고 더 있으면 마지막 id를 커서로 준다`() {
        // given
        every { chatRoomAdminRepository.findRowById(ROOM_ID) } returns room(id = ROOM_ID)
        every {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(ROOM_ID, Long.MAX_VALUE, Limit.of(3))
        } returns listOf(
            message(id = 3, type = ChatMessageType.TEXT, content = "셋"),
            message(id = 2, type = ChatMessageType.TEXT, content = "둘"),
            message(id = 1, type = ChatMessageType.TEXT, content = "하나"),
        )

        // when
        val response = adminChatService.findMessages(ROOM_ID, null, 2)

        // then
        assertThat(response.items.map { it.id }).containsExactly(2L, 3L)
        assertThat(response.nextCursor).isEqualTo(2L)
    }

    @Test
    fun `마지막 페이지면 커서를 주지 않는다`() {
        // given
        every { chatRoomAdminRepository.findRowById(ROOM_ID) } returns room(id = ROOM_ID)
        every {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(ROOM_ID, 2L, Limit.of(3))
        } returns listOf(message(id = 1, type = ChatMessageType.TEXT, content = "하나"))

        // when
        val response = adminChatService.findMessages(ROOM_ID, 2L, 2)

        // then
        assertThat(response.items.map { it.id }).containsExactly(1L)
        assertThat(response.nextCursor).isNull()
    }

    @Test
    fun `사진은 원본을, 동영상은 썸네일과 영상 URL을 서명해 준다`() {
        // given
        every { chatRoomAdminRepository.findRowById(ROOM_ID) } returns room(id = ROOM_ID)
        every {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(ROOM_ID, Long.MAX_VALUE, Limit.of(51))
        } returns listOf(
            message(
                id = 3,
                type = ChatMessageType.VIDEO,
                objectKey = "chats/v.mp4",
                thumbnailObjectKey = "chats/t.jpg",
            ),
            message(id = 2, type = ChatMessageType.PHOTO, objectKey = "chats/p.jpg"),
            message(id = 1, type = ChatMessageType.TEXT, content = "하나"),
        )
        every { photoStorage.createSignedViewUrl(any()) } answers { "https://signed/${firstArg<String>()}" }

        // when
        val response = adminChatService.findMessages(ROOM_ID, null, 50)

        // then
        val (text, photo, video) = response.items
        assertThat(text.photoUrl).isNull()
        assertThat(text.videoUrl).isNull()
        assertThat(photo.photoUrl).isEqualTo("https://signed/chats/p.jpg")
        assertThat(photo.videoUrl).isNull()
        assertThat(video.photoUrl).isEqualTo("https://signed/chats/t.jpg")
        assertThat(video.videoUrl).isEqualTo("https://signed/chats/v.mp4")
    }

    private fun room(
        id: Long,
        partnerId: Long = PARTNER_ID,
        lastMessageId: Long = 0,
        deletedAt: Instant? = null,
    ) = object : AdminChatRoomRow {
        override val id = id
        override val lowMemberId = minOf(ME_ID, partnerId)
        override val highMemberId = maxOf(ME_ID, partnerId)
        override val lastMessageId = lastMessageId
        override val createdAt: Instant = NOW
        override val deletedAt = deletedAt
    }

    private fun message(
        id: Long,
        type: ChatMessageType,
        content: String? = null,
        objectKey: String? = null,
        thumbnailObjectKey: String? = null,
    ): ChatMessage {
        val message = ChatMessage(
            roomId = ROOM_ID,
            senderId = PARTNER_ID,
            type = type,
            content = content,
            objectKey = objectKey,
            thumbnailObjectKey = thumbnailObjectKey,
        )
        ChatMessage::class.java.getDeclaredField("id").apply {
            isAccessible = true
            set(message, id)
        }
        return message
    }

    companion object {

        private const val ME_ID = 1L
        private const val PARTNER_ID = 2L
        private const val OTHER_ID = 3L
        private const val ROOM_ID = 10L
        private const val ACTOR_ID = 99L
        private val NOW: Instant = Instant.parse("2026-09-09T00:00:00Z")
    }
}
