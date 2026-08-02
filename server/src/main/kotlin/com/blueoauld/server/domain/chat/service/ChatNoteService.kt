package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse
import com.blueoauld.server.domain.chat.dto.response.SendNoteResponse
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatNoteService(

    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val memberRepository: MemberRepository,
    private val memberBlockRepository: MemberBlockRepository,
    private val pointService: PointService,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional
    fun send(senderId: Long, receiverId: Long, content: String): SendNoteResponse {
        if (senderId == receiverId) {
            throw BusinessException(ErrorCode.SELF_NOTE)
        }

        val receiver = memberRepository.findById(receiverId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (isBlocked(senderId, receiverId)) {
            throw BusinessException(ErrorCode.NOTE_BLOCKED)
        }

        val room = findRoom(senderId, receiverId) ?: openRoom(senderId, receiverId, receiver)
        val message = chatMessageRepository.save(
            ChatMessage(
                roomId = room.id,
                senderId = senderId,
                type = ChatMessageType.TEXT,
                content = content,
            ),
        )

        room.lastMessageId = message.id
        chatRoomMemberRepository.increaseUnreadCount(room.id, receiverId)
        eventPublisher.publishEvent(ChatMessageSentEvent(receiverId, ChatMessageResponse.of(message, null)))

        return SendNoteResponse(room.id)
    }

    private fun findRoom(senderId: Long, receiverId: Long) = chatRoomRepository.findByLowMemberIdAndHighMemberId(
        minOf(senderId, receiverId),
        maxOf(senderId, receiverId),
    )

    private fun openRoom(senderId: Long, receiverId: Long, receiver: Member): ChatRoom {
        if (!receiver.noteReceiveEnabled) {
            throw BusinessException(ErrorCode.NOTE_RECEIVE_DISABLED)
        }

        pointService.spend(senderId, PointType.NOTE_SEND)

        val room = chatRoomRepository.save(ChatRoom.of(senderId, receiverId))
        chatRoomMemberRepository.saveAll(
            listOf(ChatRoomMember(room.id, senderId), ChatRoomMember(room.id, receiverId)),
        )

        return room
    }

    private fun isBlocked(senderId: Long, receiverId: Long) =
        memberBlockRepository.existsByBlockerIdAndBlockedMemberId(senderId, receiverId) ||
                memberBlockRepository.existsByBlockerIdAndBlockedMemberId(receiverId, senderId)
}
