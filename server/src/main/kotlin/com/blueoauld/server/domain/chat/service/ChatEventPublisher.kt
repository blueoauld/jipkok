package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.dto.response.ChatEventResponse
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.event.ChatReactionChangedEvent
import com.blueoauld.server.domain.chat.event.ChatRoomDeletedEvent
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
class ChatEventPublisher(

    private val messagingTemplate: SimpMessagingTemplate,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun publishMessage(event: ChatMessageSentEvent) {
        send(event.receiverId, ChatEventResponse.message(event.message))
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun publishReaction(event: ChatReactionChangedEvent) {
        send(event.receiverId, ChatEventResponse.reaction(event.roomId, event.reactions))
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun publishRoomDeleted(event: ChatRoomDeletedEvent) {
        send(event.receiverId, ChatEventResponse.roomDeleted(event.roomId))
    }

    private fun send(receiverId: Long, event: ChatEventResponse) {
        runCatching { messagingTemplate.convertAndSendToUser(receiverId.toString(), DESTINATION, event) }
            .onFailure { log.error(it) { "채팅 이벤트를 전달하지 못했다. receiverId=$receiverId type=${event.type}" } }
    }

    companion object {

        const val DESTINATION = "/queue/chat"
    }
}
