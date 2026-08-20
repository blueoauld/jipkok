package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatNoteService(

    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val chatMessageService: ChatMessageService,
    private val memberRepository: MemberRepository,
    private val memberBlockRepository: MemberBlockRepository,
    private val pointService: PointService,
) {

    @Transactional
    fun send(senderId: Long, receiverId: Long, content: String) {
        if (senderId == receiverId) {
            throw BusinessException(ErrorCode.SELF_NOTE)
        }

        val receiver = memberRepository.findById(receiverId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (isBlocked(senderId, receiverId)) {
            throw BusinessException(ErrorCode.NOTE_BLOCKED)
        }

        val room = chatRoomRepository.findByMembers(senderId, receiverId) ?: openRoom(senderId, receiverId, receiver)
        chatMessageService.append(
            room = room,
            senderId = senderId,
            message = ChatMessage(
                roomId = room.id,
                senderId = senderId,
                type = ChatMessageType.TEXT,
                content = content,
            ),
        )
    }

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
