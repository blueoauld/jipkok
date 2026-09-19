package com.blueoauld.server.domain.ai.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Clock

private val log = KotlinLogging.logger {}

@Component
class AiReplyBubbleScheduler(

    private val aiReplyBubbleService: AiReplyBubbleService,
    private val clock: Clock,
) {

    @Scheduled(fixedDelay = POLL_INTERVAL_MILLIS)
    fun run() {
        aiReplyBubbleService.findDue(clock.instant()).forEach { bubble ->
            runCatching { aiReplyBubbleService.send(bubble) }
                .onFailure {
                    log.error(it) { "AI 말풍선을 보내지 못해 버린다. roomId=${bubble.roomId}" }
                    aiReplyBubbleService.drop(bubble)
                }
        }
    }

    companion object {

        private const val POLL_INTERVAL_MILLIS = 1_000L
    }
}
