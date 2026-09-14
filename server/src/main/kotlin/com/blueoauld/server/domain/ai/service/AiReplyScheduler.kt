package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyDecision
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Clock

private val log = KotlinLogging.logger {}

@Component
class AiReplyScheduler(

    private val aiReplyJobService: AiReplyJobService,
    private val aiReplyContextService: AiReplyContextService,
    private val aiReplyGenerator: AiReplyGenerator,
    private val clock: Clock,
) {

    @Scheduled(fixedDelay = POLL_INTERVAL_MILLIS)
    fun run() {
        aiReplyJobService.findDue(clock.instant()).forEach { job ->
            runCatching { process(job) }
                .onFailure {
                    log.error(it) { "AI 응답을 만들지 못했다. roomId=${job.roomId} attempts=${job.attempts}" }
                    aiReplyJobService.fail(job)
                }
        }
    }

    private fun process(job: AiReplyJob) {
        when (val decision = aiReplyContextService.decide(job)) {
            is AiReplyDecision.Drop -> {
                log.info { "AI 응답을 건너뛴다. roomId=${job.roomId} reason=${decision.reason}" }
                aiReplyJobService.drop(job)
            }

            is AiReplyDecision.Postpone -> aiReplyJobService.postpone(job, decision.dueAt)

            is AiReplyDecision.Reply -> {
                val reply = aiReplyGenerator.generate(decision.context)

                if (reply == null) {
                    aiReplyJobService.drop(job)
                } else {
                    aiReplyJobService.complete(job, decision.context.lastMessageId, reply)
                }
            }
        }
    }

    companion object {

        private const val POLL_INTERVAL_MILLIS = 5_000L
    }
}
