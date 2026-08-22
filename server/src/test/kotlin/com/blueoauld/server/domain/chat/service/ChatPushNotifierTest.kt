package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.service.PushMessages
import com.blueoauld.server.domain.push.service.PushService
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

class ChatPushNotifierTest {

    private val pushService = mockk<PushService>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>()

    private val chatRoomMemberRepository = mockk<ChatRoomMemberRepository>(relaxed = true)

    private val memberSuspensionService = mockk<MemberSuspensionService>()

    private val pushMessages = mockk<PushMessages>(relaxed = true)

    private val notifier = ChatPushNotifier(
        pushService,
        memberRepository,
        chatRoomMemberRepository,
        memberSuspensionService,
        pushMessages,
    )

    @BeforeEach
    fun setUp() {
        every { pushService.isConnected(RECEIVER_ID) } returns false
        every { memberRepository.findById(SENDER_ID) } returns Optional.of(sender())
        every { memberRepository.findLocaleById(RECEIVER_ID) } returns MemberLocale.KO
        every { memberSuspensionService.isSuspended(RECEIVER_ID, SuspensionType.SERVICE) } returns false
    }

    @Test
    fun `받는 쪽이 서비스 정지 중이면 푸시를 보내지 않는다`() {
        // given
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, RECEIVER_ID) } returns
            roomMember(notificationEnabled = true)
        every { memberSuspensionService.isSuspended(RECEIVER_ID, SuspensionType.SERVICE) } returns true

        // when
        notifier.notifySent(event())

        // then
        verify(exactly = 0) { pushService.send(any(), any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `알림이 켜진 방이면 푸시를 보낸다`() {
        // given
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, RECEIVER_ID) } returns
            roomMember(notificationEnabled = true)

        // when
        notifier.notifySent(event())

        // then
        verify(exactly = 1) { pushService.send(RECEIVER_ID, any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `글 메시지는 언어를 읽지 않는다`() {
        // given
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, RECEIVER_ID) } returns
            roomMember(notificationEnabled = true)

        // when
        notifier.notifySent(event())

        // then
        verify(exactly = 0) { memberRepository.findLocaleById(any()) }
    }

    @Test
    fun `사진 메시지는 받는 사람의 언어로 문구를 만든다`() {
        // given
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, RECEIVER_ID) } returns
            roomMember(notificationEnabled = true)
        every { memberRepository.findLocaleById(RECEIVER_ID) } returns MemberLocale.JA
        every { pushMessages.get(MemberLocale.JA, "push.chat.photo") } returns "写真"

        // when
        notifier.notifySent(event(ChatMessageType.PHOTO))

        // then
        verify { pushService.send(RECEIVER_ID, any(), "写真", any(), any(), any(), any()) }
    }

    @Test
    fun `알림을 끈 방이면 푸시를 보내지 않는다`() {
        // given
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, RECEIVER_ID) } returns
            roomMember(notificationEnabled = false)

        // when
        notifier.notifySent(event())

        // then
        verify(exactly = 0) { pushService.send(any(), any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `방에 소속돼 있지 않으면 푸시를 보내지 않는다`() {
        // given
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, RECEIVER_ID) } returns null

        // when
        notifier.notifySent(event())

        // then
        verify(exactly = 0) { pushService.send(any(), any(), any(), any(), any(), any(), any()) }
    }

    private fun roomMember(notificationEnabled: Boolean) = ChatRoomMember(
        roomId = ROOM_ID,
        memberId = RECEIVER_ID,
        notificationEnabled = notificationEnabled,
    )

    private fun event(type: ChatMessageType = ChatMessageType.TEXT) = ChatMessageSentEvent(
        receiverId = RECEIVER_ID,
        message = ChatMessageResponse(
            messageId = 1L,
            roomId = ROOM_ID,
            senderId = SENDER_ID,
            type = type,
            content = "안녕하세요",
            imageUrl = null,
            createdAt = Instant.parse("2026-08-05T12:00:00Z"),
        ),
    )

    private fun sender() = Member(
        phoneNumber = "+821012345678",
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "보낸이",
        birthYear = 1998,
    )

    companion object {

        private const val ROOM_ID = 10L
        private const val SENDER_ID = 1L
        private const val RECEIVER_ID = 2L
    }
}
