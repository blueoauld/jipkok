package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.repository.AccessLogRepository
import com.blueoauld.server.domain.access.repository.AccessRewardRepository
import com.blueoauld.server.global.time.KOREA_ID
import com.blueoauld.server.global.time.today
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Period

private val log = KotlinLogging.logger {}

@Component
class AccessLogCleaner(

    private val accessLogRepository: AccessLogRepository,
    private val accessRewardRepository: AccessRewardRepository,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUp() {
        val removed = accessLogRepository.deleteAllCreatedBefore(clock.instant().minus(RETENTION)) +
            accessRewardRepository.deleteAllAccessedBefore(clock.today().minus(REWARD_RETENTION))

        if (removed > 0) {
            log.info { "오래된 접속 기록 ${removed}건을 정리했다." }
        }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)
        val REWARD_RETENTION: Period = Period.ofDays(90)

        private const val CLEAN_UP_CRON = "0 50 4 * * *"
    }
}
