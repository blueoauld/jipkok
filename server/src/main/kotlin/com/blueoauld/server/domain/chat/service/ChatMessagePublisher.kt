package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
class ChatMessagePublisher(

    private val messagingTemplate: SimpMessagingTemplate,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun publish(event: ChatMessageSentEvent) {
        runCatching {
            messagingTemplate.convertAndSendToUser(event.receiverId.toString(), DESTINATION, event.message)
        }.onFailure {
            log.error(it) { "메시지를 전달하지 못했다. receiverId=${event.receiverId}" }
        }
    }

    companion object {

        const val DESTINATION = "/queue/chat"
    }
}
