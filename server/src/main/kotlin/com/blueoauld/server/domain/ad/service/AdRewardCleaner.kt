package com.blueoauld.server.domain.ad.service

import com.blueoauld.server.domain.ad.repository.AdRewardRepository
import com.blueoauld.server.global.time.KOREA_ID
import com.blueoauld.server.global.time.today
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Period

private val log = KotlinLogging.logger {}

@Component
class AdRewardCleaner(

    private val adRewardRepository: AdRewardRepository,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUp() {
        val removed = adRewardRepository.deleteAllRewardedBefore(clock.today().minus(RETENTION))

        if (removed > 0) {
            log.info { "오래된 광고 보상 기록 ${removed}건을 정리했다." }
        }
    }

    companion object {

        val RETENTION: Period = Period.ofDays(90)

        private const val CLEAN_UP_CRON = "0 5 5 * * *"
    }
}
