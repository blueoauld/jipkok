package com.blueoauld.server.domain.ai.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
class AiNudgeScheduler(

    private val aiReplyJobService: AiReplyJobService,
) {

    @Scheduled(fixedDelay = SCAN_INTERVAL_MILLIS, initialDelay = SCAN_INTERVAL_MILLIS)
    fun run() {
        val scheduled = aiReplyJobService.scheduleNudges()

        if (scheduled > 0) {
            log.info { "AI가 먼저 말을 걸 방 ${scheduled}개를 예약했다." }
        }
    }

    companion object {

        private const val SCAN_INTERVAL_MILLIS = 60 * 60 * 1000L
    }
}
