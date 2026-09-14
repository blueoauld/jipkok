package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
class AiReplyListener(

    private val aiReplyJobService: AiReplyJobService,
) {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMessageSent(event: ChatMessageSentEvent) {
        runCatching { aiReplyJobService.schedule(event) }
            .onFailure { log.error(it) { "AI 응답을 예약하지 못했다. roomId=${event.message.roomId}" } }
    }
}
