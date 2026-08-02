package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.projection.ChatRoomRow
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatRoomDeletedEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.service.MemberSummaryService
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
import org.springframework.data.domain.Limit
import java.time.Instant
import java.util.*

class ChatRoomServiceTest {

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val memberSummaryService = mockk<MemberSummaryService>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val room = ChatRoom.of(ME_ID, PARTNER_ID)

    private val chatRoomService = ChatRoomService(
        chatRoomRepository,
        memberSummaryService,
        eventPublisher,
    )

    @BeforeEach
    fun setUp() {
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
    }

    @Test
    fun `목록은 상대 정보와 마지막 메시지를 함께 준다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(listOf(PARTNER_ID)) } returns listOf(summary())

        // when
        val response = chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 20)

        // then
        val item = response.items.single()
        assertThat(item.roomId).isEqualTo(ROOM_ID)
        assertThat(item.memberId).isEqualTo(PARTNER_ID)
        assertThat(item.nickname).isEqualTo("상대")
        assertThat(item.lastMessageContent).isEqualTo("안녕하세요.")
        assertThat(item.unreadCount).isEqualTo(3)
    }

    @Test
    fun `커서가 없으면 가장 최근 방부터 준다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns emptyList()

        // when
        chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 20)

        // then
        verify { chatRoomRepository.findRooms(ME_ID, 0, Long.MAX_VALUE, Limit.of(20)) }
    }

    @Test
    fun `안읽음만 보면 안읽은 방만 조회한다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns emptyList()

        // when
        chatRoomService.findRooms(ME_ID, unreadOnly = true, cursor = CURSOR, size = 20)

        // then
        verify { chatRoomRepository.findRooms(ME_ID, 1, CURSOR, Limit.of(20)) }
    }

    @Test
    fun `페이지가 가득 차면 다음 커서를 준다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(any()) } returns listOf(summary())

        // when
        val response = chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 1)

        // then
        assertThat(response.nextCursor).isEqualTo(LAST_MESSAGE_ID)
    }

    @Test
    fun `마지막 페이지면 다음 커서가 없다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(any()) } returns listOf(summary())

        // when
        val response = chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 20)

        // then
        assertThat(response.nextCursor).isNull()
    }

    @Test
    fun `탈퇴한 상대의 방은 빠진다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(any()) } returns emptyList()

        // when
        val response = chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 20)

        // then
        assertThat(response.items).isEmpty()
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

    private fun row() = mockk<ChatRoomRow> {
        every { getRoomId() } returns ROOM_ID
        every { getPartnerId() } returns PARTNER_ID
        every { getUnreadCount() } returns 3
        every { getLastMessageId() } returns LAST_MESSAGE_ID
        every { getLastMessageType() } returns ChatMessageType.TEXT
        every { getLastMessageContent() } returns "안녕하세요."
        every { getLastMessageAt() } returns NOW
    }

    private fun summary() = MemberSummaryResponse(
        memberId = PARTNER_ID,
        nickname = "상대",
        gender = Gender.FEMALE,
        age = 28,
        receivedLikeCount = 0,
        comment = null,
        profileImageUrl = null,
    )

    companion object {

        private const val ROOM_ID = 10L
        private const val LAST_MESSAGE_ID = 99L
        private const val CURSOR = 50L
        private const val ME_ID = 1L
        private const val PARTNER_ID = 2L
        private const val STRANGER_ID = 3L

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")
    }
}
