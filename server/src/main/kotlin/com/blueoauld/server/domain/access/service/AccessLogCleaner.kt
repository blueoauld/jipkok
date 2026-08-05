package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.repository.AccessLogRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class AccessLogCleaner(

    private val accessLogRepository: AccessLogRepository,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA)
    @Transactional
    fun cleanUp() {
        val removed = accessLogRepository.deleteAllCreatedBefore(clock.instant().minus(RETENTION))

        if (removed > 0) {
            log.info { "오래된 접속 기록 ${removed}건을 정리했다." }
        }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)

        private const val CLEAN_UP_CRON = "0 50 4 * * *"
        private const val KOREA = "Asia/Seoul"
    }
}
