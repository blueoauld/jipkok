package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
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

class ChatNoteServiceTest {

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val chatRoomMemberRepository = mockk<ChatRoomMemberRepository>(relaxed = true)

    private val chatMessageRepository = mockk<ChatMessageRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val memberBlockRepository = mockk<MemberBlockRepository>(relaxed = true)

    private val pointService = mockk<PointService>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val chatNoteService = ChatNoteService(
        chatRoomRepository,
        chatRoomMemberRepository,
        chatMessageRepository,
        memberRepository,
        memberBlockRepository,
        pointService,
        eventPublisher,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(RECEIVER_ID) } returns Optional.of(member())
        every { memberBlockRepository.existsByBlockerIdAndBlockedMemberId(any(), any()) } returns false
        every { chatRoomRepository.findByMembers(any(), any()) } returns null
        every { chatRoomRepository.save(any()) } answers { firstArg() }
        every { chatMessageRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `쪽지를 보내면 방이 열리고 메시지가 남는다`() {
        // given
        val room = slot<ChatRoom>()
        val message = slot<ChatMessage>()

        // when
        chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)

        // then
        verify { chatRoomRepository.save(capture(room)) }
        verify { chatMessageRepository.save(capture(message)) }
        assertThat(room.captured.lowMemberId).isEqualTo(SENDER_ID)
        assertThat(room.captured.highMemberId).isEqualTo(RECEIVER_ID)
        assertThat(message.captured.senderId).isEqualTo(SENDER_ID)
        assertThat(message.captured.type).isEqualTo(ChatMessageType.TEXT)
        assertThat(message.captured.content).isEqualTo(CONTENT)
    }

    @Test
    fun `누가 먼저 보내든 방의 회원 순서는 같다`() {
        // given
        every { memberRepository.findById(SENDER_ID) } returns Optional.of(member())
        val room = slot<ChatRoom>()

        // when
        chatNoteService.send(RECEIVER_ID, SENDER_ID, CONTENT)

        // then
        verify { chatRoomRepository.save(capture(room)) }
        assertThat(room.captured.lowMemberId).isEqualTo(SENDER_ID)
        assertThat(room.captured.highMemberId).isEqualTo(RECEIVER_ID)
    }

    @Test
    fun `방을 열면 참여자가 두 명 생긴다`() {
        // given
        val members = slot<List<ChatRoomMember>>()

        // when
        chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)

        // then
        verify { chatRoomMemberRepository.saveAll(capture(members)) }
        assertThat(members.captured.map { it.memberId }).containsExactly(SENDER_ID, RECEIVER_ID)
    }

    @Test
    fun `방을 열면 포인트를 차감한다`() {
        // when
        chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)

        // then
        verify { pointService.spend(SENDER_ID, PointType.NOTE_SEND) }
    }

    @Test
    fun `방이 이미 있으면 포인트를 차감하지 않는다`() {
        // given
        every { chatRoomRepository.findByMembers(SENDER_ID, RECEIVER_ID) } returns ChatRoom.of(SENDER_ID, RECEIVER_ID)

        // when
        chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)

        // then
        verify(exactly = 0) { pointService.spend(any(), any()) }
        verify(exactly = 0) { chatRoomRepository.save(any()) }
        verify { chatMessageRepository.save(any()) }
    }

    @Test
    fun `쪽지를 보내면 상대의 안읽음 수가 올라간다`() {
        // when
        chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)

        // then
        verify { chatRoomMemberRepository.increaseUnreadCount(any(), RECEIVER_ID) }
    }

    @Test
    fun `쪽지를 보내면 상대에게 전달할 이벤트가 발행된다`() {
        // given
        val event = slot<ChatMessageSentEvent>()

        // when
        chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)

        // then
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.receiverId).isEqualTo(RECEIVER_ID)
        assertThat(event.captured.message.senderId).isEqualTo(SENDER_ID)
        assertThat(event.captured.message.content).isEqualTo(CONTENT)
    }

    @Test
    fun `자기 자신에게는 쪽지를 보낼 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatNoteService.send(SENDER_ID, SENDER_ID, CONTENT)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_NOTE)
        verify(exactly = 0) { chatMessageRepository.save(any()) }
    }

    @Test
    fun `쪽지 수신을 끈 상대에게는 방을 열 수 없다`() {
        // given
        every { memberRepository.findById(RECEIVER_ID) } returns Optional.of(member(noteReceiveEnabled = false))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.NOTE_RECEIVE_DISABLED)
        verify(exactly = 0) { pointService.spend(any(), any()) }
    }

    @Test
    fun `쪽지 수신을 꺼도 이미 열린 방에는 보낼 수 있다`() {
        // given
        every { memberRepository.findById(RECEIVER_ID) } returns Optional.of(member(noteReceiveEnabled = false))
        every { chatRoomRepository.findByMembers(SENDER_ID, RECEIVER_ID) } returns ChatRoom.of(SENDER_ID, RECEIVER_ID)

        // when
        chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)

        // then
        verify { chatMessageRepository.save(any()) }
    }

    @Test
    fun `내가 차단한 상대에게는 쪽지를 보낼 수 없다`() {
        // given
        every { memberBlockRepository.existsByBlockerIdAndBlockedMemberId(SENDER_ID, RECEIVER_ID) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.NOTE_BLOCKED)
        verify(exactly = 0) { chatMessageRepository.save(any()) }
    }

    @Test
    fun `나를 차단한 상대에게는 쪽지를 보낼 수 없다`() {
        // given
        every { memberBlockRepository.existsByBlockerIdAndBlockedMemberId(RECEIVER_ID, SENDER_ID) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.NOTE_BLOCKED)
        verify(exactly = 0) { chatMessageRepository.save(any()) }
    }

    @Test
    fun `없는 회원에게는 쪽지를 보낼 수 없다`() {
        // given
        every { memberRepository.findById(RECEIVER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            chatNoteService.send(SENDER_ID, RECEIVER_ID, CONTENT)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun member(noteReceiveEnabled: Boolean = true) = Member(
        phoneNumber = "01012345678",
        password = "encoded-password",
        gender = Gender.FEMALE,
        nickname = "상대",
        birthYear = 1998,
        noteReceiveEnabled = noteReceiveEnabled,
    )

    companion object {

        private const val SENDER_ID = 1L
        private const val RECEIVER_ID = 2L

        private const val CONTENT = "안녕하세요."
    }
}
