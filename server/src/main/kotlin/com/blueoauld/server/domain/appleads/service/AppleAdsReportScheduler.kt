package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.global.time.KOREA_ID
import com.blueoauld.server.global.time.today
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.Period

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${apple-ads.client-id:}'.isEmpty()")
class AppleAdsReportScheduler(

    private val reportSyncer: AppleAdsReportSyncer,
    private val clock: Clock,
) {

    @Scheduled(cron = SYNC_CRON, zone = KOREA_ID)
    fun syncRecent() {
        val today = clock.today()

        runCatching { reportSyncer.sync(today.minus(SYNC_WINDOW), today) }
            .onFailure { log.error(it) { "애플 광고 리포트를 적재하지 못했다." } }
    }

    companion object {

        val SYNC_WINDOW: Period = Period.ofDays(7)

        private const val SYNC_CRON = "0 0 6 * * *"
    }
}
