package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.projection.ChatRoomRow
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatRoomDeletedEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.request.EnabledRequest
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

    private val chatRoomMemberRepository = mockk<ChatRoomMemberRepository>(relaxed = true)

    private val memberSummaryService = mockk<MemberSummaryService>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val room = ChatRoom.of(ME_ID, PARTNER_ID)

    private val chatRoomService = ChatRoomService(
        chatRoomRepository,
        chatRoomMemberRepository,
        memberSummaryService,
        eventPublisher,
    )

    @BeforeEach
    fun setUp() {
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
    }

    @Test
    fun `안읽은 메시지 수를 모두 더해 준다`() {
        // given
        every { chatRoomMemberRepository.sumUnreadCount(ME_ID) } returns 7

        // when
        val count = chatRoomService.findUnreadCount(ME_ID)

        // then
        assertThat(count).isEqualTo(7)
    }

    @Test
    fun `방을 조회하면 상대 정보를 함께 준다`() {
        // given
        every { chatRoomRepository.findRoom(ME_ID, ROOM_ID) } returns row()
        every { memberSummaryService.findSummaries(ME_ID, listOf(PARTNER_ID)) } returns listOf(summary())

        // when
        val response = chatRoomService.findRoom(ME_ID, ROOM_ID)

        // then
        assertThat(response.roomId).isEqualTo(ROOM_ID)
        assertThat(response.memberId).isEqualTo(PARTNER_ID)
        assertThat(response.nickname).isEqualTo("상대")
    }

    @Test
    fun `참여자가 아니면 방을 조회할 수 없다`() {
        // given
        every { chatRoomRepository.findRoom(STRANGER_ID, ROOM_ID) } returns null

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.findRoom(STRANGER_ID, ROOM_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    @Test
    fun `목록은 상대 정보와 마지막 메시지를 함께 준다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(ME_ID, listOf(PARTNER_ID)) } returns listOf(summary())

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
        every { memberSummaryService.findSummaries(ME_ID, any()) } returns listOf(summary())

        // when
        val response = chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 1)

        // then
        assertThat(response.nextCursor).isEqualTo(LAST_MESSAGE_ID)
    }

    @Test
    fun `마지막 페이지면 다음 커서가 없다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(ME_ID, any()) } returns listOf(summary())

        // when
        val response = chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 20)

        // then
        assertThat(response.nextCursor).isNull()
    }

    @Test
    fun `탈퇴한 상대의 방은 빠진다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(ME_ID, any()) } returns emptyList()

        // when
        val response = chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 20)

        // then
        assertThat(response.items).isEmpty()
    }

    @Test
    fun `닉네임 일부만 넣어도 방을 찾는다`() {
        // given
        every { chatRoomRepository.searchRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(ME_ID, any()) } returns listOf(summary())

        // when
        val response = chatRoomService.searchRooms(ME_ID, "대", cursor = null, size = 20)

        // then
        verify { chatRoomRepository.searchRooms(ME_ID, "%대%", Long.MAX_VALUE, Limit.of(20)) }
        assertThat(response.items.single().nickname).isEqualTo("상대")
    }

    @Test
    fun `와일드카드를 그대로 보내면 이스케이프된다`() {
        // given
        every { chatRoomRepository.searchRooms(any(), any(), any(), any()) } returns emptyList()

        // when
        chatRoomService.searchRooms(ME_ID, "100%_", cursor = null, size = 20)

        // then
        verify { chatRoomRepository.searchRooms(ME_ID, """%100\%\_%""", Long.MAX_VALUE, Limit.of(20)) }
    }

    @Test
    fun `검색어가 비어 있으면 조회하지 않는다`() {
        // when
        val response = chatRoomService.searchRooms(ME_ID, "   ", cursor = null, size = 20)

        // then
        assertThat(response.items).isEmpty()
        verify(exactly = 0) { chatRoomRepository.searchRooms(any(), any(), any(), any()) }
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
    fun `여러 방을 한 번에 나가면 모두 소프트 딜리트된다`() {
        // given
        val another = ChatRoom.of(ME_ID, ANOTHER_PARTNER_ID)
        every { chatRoomRepository.findAllById(listOf(ROOM_ID, ANOTHER_ROOM_ID)) } returns listOf(room, another)

        // when
        chatRoomService.leaveAll(ME_ID, listOf(ROOM_ID, ANOTHER_ROOM_ID))

        // then
        verify { chatRoomRepository.softDeleteAllByIdIn(listOf(room.id, another.id)) }
    }

    @Test
    fun `여러 방을 한 번에 나가면 상대마다 알린다`() {
        // given
        val another = ChatRoom.of(ME_ID, ANOTHER_PARTNER_ID)
        every { chatRoomRepository.findAllById(listOf(ROOM_ID, ANOTHER_ROOM_ID)) } returns listOf(room, another)
        val events = mutableListOf<Any>()

        // when
        chatRoomService.leaveAll(ME_ID, listOf(ROOM_ID, ANOTHER_ROOM_ID))

        // then
        verify { eventPublisher.publishEvent(capture(events)) }
        assertThat(events.filterIsInstance<ChatRoomDeletedEvent>().map { it.receiverId })
            .containsExactly(PARTNER_ID, ANOTHER_PARTNER_ID)
    }

    @Test
    fun `내 방이 아니면 한 번에 나갈 때 건너뛴다`() {
        // given
        every { chatRoomRepository.findAllById(listOf(ROOM_ID)) } returns listOf(room)

        // when
        chatRoomService.leaveAll(STRANGER_ID, listOf(ROOM_ID))

        // then
        verify(exactly = 0) { chatRoomRepository.softDeleteAllByIdIn(any()) }
        verify(exactly = 0) { eventPublisher.publishEvent(any()) }
    }

    @Test
    fun `없는 방이 섞여 있어도 나머지는 나간다`() {
        // given
        every { chatRoomRepository.findAllById(listOf(ROOM_ID, GONE_ROOM_ID)) } returns listOf(room)

        // when
        chatRoomService.leaveAll(ME_ID, listOf(ROOM_ID, GONE_ROOM_ID))

        // then
        verify(exactly = 1) { chatRoomRepository.softDeleteAllByIdIn(listOf(room.id)) }
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

    @Test
    fun `읽음 처리하면 안읽음 수가 다시 계산된다`() {
        // when
        chatRoomService.markRead(ME_ID, ROOM_ID, LAST_READ_MESSAGE_ID)

        // then
        verify { chatRoomMemberRepository.markRead(ROOM_ID, ME_ID, LAST_READ_MESSAGE_ID) }
    }

    @Test
    fun `여러 방을 한 번에 읽음 처리한다`() {
        // when
        chatRoomService.markAllRead(ME_ID, listOf(ROOM_ID, ANOTHER_ROOM_ID))

        // then
        verify { chatRoomMemberRepository.markAllRead(ME_ID, listOf(ROOM_ID, ANOTHER_ROOM_ID)) }
    }

    @Test
    fun `읽음 처리할 방이 없으면 조회하지 않는다`() {
        // when
        chatRoomService.markAllRead(ME_ID, emptyList())

        // then
        verify(exactly = 0) { chatRoomMemberRepository.markAllRead(any(), any()) }
    }

    @Test
    fun `참여자가 아니면 읽음 처리할 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.markRead(STRANGER_ID, ROOM_ID, LAST_READ_MESSAGE_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
        verify(exactly = 0) { chatRoomMemberRepository.markRead(any(), any(), any()) }
    }

    @Test
    fun `채팅방 알림을 끈다`() {
        // given
        val roomMember = ChatRoomMember(roomId = ROOM_ID, memberId = ME_ID)
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, ME_ID) } returns roomMember

        // when
        chatRoomService.updateNotification(ME_ID, ROOM_ID, EnabledRequest(false))

        // then
        assertThat(roomMember.notificationEnabled).isFalse()
    }

    @Test
    fun `고정한 방은 첫 페이지 맨 위에 나온다`() {
        // given
        every { chatRoomRepository.findPinnedRooms(ME_ID, 0) } returns listOf(row(pinned = true, lastMessageId = 10L))
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns listOf(row())
        every { memberSummaryService.findSummaries(ME_ID, any()) } returns listOf(summary())

        // when
        val response = chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = null, size = 1)

        // then
        assertThat(response.items.map { it.pinned }).containsExactly(true, false)
        assertThat(response.nextCursor).isEqualTo(LAST_MESSAGE_ID)
    }

    @Test
    fun `다음 페이지부터는 고정한 방을 조회하지 않는다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns emptyList()

        // when
        chatRoomService.findRooms(ME_ID, unreadOnly = false, cursor = CURSOR, size = 20)

        // then
        verify(exactly = 0) { chatRoomRepository.findPinnedRooms(any(), any()) }
    }

    @Test
    fun `안읽음만 볼 때는 고정한 방도 안읽은 것만 나온다`() {
        // given
        every { chatRoomRepository.findRooms(any(), any(), any(), any()) } returns emptyList()

        // when
        chatRoomService.findRooms(ME_ID, unreadOnly = true, cursor = null, size = 20)

        // then
        verify { chatRoomRepository.findPinnedRooms(ME_ID, 1) }
    }

    @Test
    fun `채팅방을 고정한다`() {
        // given
        val roomMember = ChatRoomMember(roomId = ROOM_ID, memberId = ME_ID)
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, ME_ID) } returns roomMember
        every { chatRoomMemberRepository.countPinnedRooms(ME_ID) } returns 4

        // when
        chatRoomService.updatePin(ME_ID, ROOM_ID, EnabledRequest(true))

        // then
        assertThat(roomMember.pinned).isTrue()
    }

    @Test
    fun `고정은 5개까지만 할 수 있다`() {
        // given
        val roomMember = ChatRoomMember(roomId = ROOM_ID, memberId = ME_ID)
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, ME_ID) } returns roomMember
        every { chatRoomMemberRepository.countPinnedRooms(ME_ID) } returns 5

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.updatePin(ME_ID, ROOM_ID, EnabledRequest(true))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.PIN_LIMIT_EXCEEDED)
        assertThat(roomMember.pinned).isFalse()
    }

    @Test
    fun `이미 고정한 방을 다시 고정해도 개수 제한에 걸리지 않는다`() {
        // given
        val roomMember = ChatRoomMember(roomId = ROOM_ID, memberId = ME_ID, pinned = true)
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, ME_ID) } returns roomMember
        every { chatRoomMemberRepository.countPinnedRooms(ME_ID) } returns 5

        // when
        chatRoomService.updatePin(ME_ID, ROOM_ID, EnabledRequest(true))

        // then
        assertThat(roomMember.pinned).isTrue()
    }

    @Test
    fun `고정을 풀면 개수와 상관없이 풀린다`() {
        // given
        val roomMember = ChatRoomMember(roomId = ROOM_ID, memberId = ME_ID, pinned = true)
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, ME_ID) } returns roomMember

        // when
        chatRoomService.updatePin(ME_ID, ROOM_ID, EnabledRequest(false))

        // then
        assertThat(roomMember.pinned).isFalse()
        verify(exactly = 0) { chatRoomMemberRepository.countPinnedRooms(any()) }
    }

    @Test
    fun `내가 속하지 않은 방은 고정할 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.updatePin(STRANGER_ID, ROOM_ID, EnabledRequest(true))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    @Test
    fun `내가 속하지 않은 방의 알림은 바꿀 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.updateNotification(STRANGER_ID, ROOM_ID, EnabledRequest(false))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    @Test
    fun `이미 나간 방은 고정할 수 없다`() {
        // given
        every { chatRoomRepository.findById(GONE_ROOM_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.updatePin(ME_ID, GONE_ROOM_ID, EnabledRequest(true))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    @Test
    fun `이미 나간 방의 알림은 바꿀 수 없다`() {
        // given
        every { chatRoomRepository.findById(GONE_ROOM_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatRoomService.updateNotification(ME_ID, GONE_ROOM_ID, EnabledRequest(false))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
    }

    private fun row(pinned: Boolean = false, lastMessageId: Long = LAST_MESSAGE_ID) = mockk<ChatRoomRow> {
        every { getRoomId() } returns ROOM_ID
        every { getPartnerId() } returns PARTNER_ID
        every { getUnreadCount() } returns 3
        every { getNotificationEnabled() } returns true
        every { getPinned() } returns pinned
        every { getLastMessageId() } returns lastMessageId
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
        memo = null,
    )

    companion object {

        private const val ROOM_ID = 10L
        private const val ANOTHER_ROOM_ID = 11L
        private const val GONE_ROOM_ID = 12L
        private const val LAST_MESSAGE_ID = 99L
        private const val LAST_READ_MESSAGE_ID = 90L
        private const val CURSOR = 50L
        private const val ME_ID = 1L
        private const val PARTNER_ID = 2L
        private const val STRANGER_ID = 3L
        private const val ANOTHER_PARTNER_ID = 4L

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")
    }
}
