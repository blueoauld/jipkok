package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.event.ChatRoomDeletedEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatRoomService(

    private val chatRoomRepository: ChatRoomRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional
    fun leave(memberId: Long, roomId: Long) {
        val room = chatRoomRepository.findById(roomId)
            .filter { it.contains(memberId) }
            .orElseThrow { BusinessException(ErrorCode.CHAT_ROOM_NOT_FOUND) }

        val partnerId = room.partnerIdOf(memberId)

        chatRoomRepository.delete(room)
        eventPublisher.publishEvent(ChatRoomDeletedEvent(partnerId, roomId))
    }
}
