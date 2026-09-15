package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingDecision
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.global.exception.BusinessException
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Clock

private val log = KotlinLogging.logger {}

@Component
class AiGreetingScheduler(

    private val aiGreetingJobService: AiGreetingJobService,
    private val aiGreetingContextService: AiGreetingContextService,
    private val aiReplyGenerator: AiReplyGenerator,
    private val clock: Clock,
) {

    @Scheduled(fixedDelay = SCAN_INTERVAL_MILLIS, initialDelay = SCAN_INTERVAL_MILLIS)
    fun scan() {
        val scheduled = aiGreetingJobService.schedule()

        if (scheduled > 0) {
            log.info { "AI가 먼저 쪽지를 보낼 회원 ${scheduled}명을 예약했다." }
        }
    }

    @Scheduled(fixedDelay = POLL_INTERVAL_MILLIS)
    fun run() {
        aiGreetingJobService.findDue(clock.instant()).forEach { job ->
            runCatching { process(job) }
                .onFailure { handleFailure(job, it) }
        }
    }

    private fun process(job: AiGreetingJob) {
        when (val decision = aiGreetingContextService.decide(job)) {
            is AiGreetingDecision.Drop -> {
                log.info { "AI 첫 쪽지를 건너뛴다. memberId=${job.memberId} reason=${decision.reason}" }
                aiGreetingJobService.drop(job, decision.reason)
            }

            is AiGreetingDecision.Postpone -> aiGreetingJobService.postpone(job, decision.dueAt)

            is AiGreetingDecision.Send -> {
                val reply = aiReplyGenerator.greet(decision.context)

                if (reply == null) {
                    aiGreetingJobService.drop(job, "첫 쪽지를 만들지 못했다.")
                } else {
                    aiGreetingJobService.complete(job, decision.context, reply)
                }
            }
        }
    }

    private fun handleFailure(job: AiGreetingJob, cause: Throwable) {
        if (cause is BusinessException) {
            log.info { "AI 첫 쪽지를 보낼 수 없어 건너뛴다. memberId=${job.memberId} code=${cause.errorCode.name}" }
            aiGreetingJobService.drop(job, cause.errorCode.name)
            return
        }

        log.error(cause) { "AI 첫 쪽지를 보내지 못했다. memberId=${job.memberId} attempts=${job.attempts}" }
        aiGreetingJobService.fail(job)
    }

    companion object {

        private const val SCAN_INTERVAL_MILLIS = 10 * 60 * 1000L
        private const val POLL_INTERVAL_MILLIS = 5_000L
    }
}
