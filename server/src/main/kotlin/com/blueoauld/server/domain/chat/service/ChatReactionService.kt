package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.request.ReactMessageRequest
import com.blueoauld.server.domain.chat.dto.response.ChatReactionResponse
import com.blueoauld.server.domain.chat.dto.response.ChatReactionsResponse
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatMessageReaction
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.event.ChatReactionChangedEvent
import com.blueoauld.server.domain.chat.repository.ChatMessageReactionRepository
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.repository.getMessageOf
import com.blueoauld.server.domain.chat.repository.getRoomOf
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatReactionService(

    private val chatRoomRepository: ChatRoomRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val chatMessageReactionRepository: ChatMessageReactionRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional
    fun react(memberId: Long, roomId: Long, messageId: Long, request: ReactMessageRequest): ChatReactionsResponse {
        val room = chatRoomRepository.getRoomOf(memberId, roomId)
        val message = chatMessageRepository.getMessageOf(roomId, messageId)

        val existing = chatMessageReactionRepository.findByMessageIdAndMemberId(message.id, memberId)

        if (existing == null) {
            chatMessageReactionRepository.save(
                ChatMessageReaction(
                    roomId = roomId,
                    messageId = message.id,
                    memberId = memberId,
                    type = request.type,
                ),
            )
        } else {
            existing.type = request.type
        }
        chatMessageReactionRepository.flush()

        return publishReactions(room, memberId, message)
    }

    @Transactional
    fun unreact(memberId: Long, roomId: Long, messageId: Long): ChatReactionsResponse {
        val room = chatRoomRepository.getRoomOf(memberId, roomId)
        val message = chatMessageRepository.getMessageOf(roomId, messageId)

        chatMessageReactionRepository.findByMessageIdAndMemberId(message.id, memberId)?.let {
            chatMessageReactionRepository.delete(it)
            chatMessageReactionRepository.flush()
        }

        return publishReactions(room, memberId, message)
    }

    @Transactional(readOnly = true)
    fun findByMessageIds(messageIds: List<Long>): Map<Long, List<ChatReactionResponse>> {
        if (messageIds.isEmpty()) {
            return emptyMap()
        }

        return chatMessageReactionRepository.findByMessageIdIn(messageIds)
            .groupBy({ it.messageId }, ChatReactionResponse::from)
    }

    private fun publishReactions(room: ChatRoom, memberId: Long, message: ChatMessage): ChatReactionsResponse {
        val response = ChatReactionsResponse(
            messageId = message.id,
            reactions = chatMessageReactionRepository.findByMessageId(message.id).map(ChatReactionResponse::from),
        )

        eventPublisher.publishEvent(ChatReactionChangedEvent(room.partnerIdOf(memberId), message.roomId, response))

        return response
    }
}
