package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.global.time.KOREA_ID
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class AiReplyLogCleaner(

    private val aiReplyLogRepository: AiReplyLogRepository,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUp() {
        val removed = aiReplyLogRepository.deleteAllByCreatedAtBefore(clock.instant().minus(RETENTION))

        if (removed > 0) {
            log.info { "오래된 AI 응답 로그 ${removed}건을 정리했다." }
        }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)

        private const val CLEAN_UP_CRON = "0 10 5 * * *"
    }
}
