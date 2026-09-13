package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.global.time.KOREA_ID
import com.blueoauld.server.global.time.today
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Clock

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${apple-ads.client-id:}'.isEmpty()")
class AppleAdsScheduler(

    private val reportSyncer: AppleAdsReportSyncer,
    private val automationService: AppleAdsAutomationService,
    private val clock: Clock,
) {

    @Scheduled(cron = DAILY_CRON, zone = KOREA_ID)
    fun runDaily() {
        val today = clock.today()
        val startDate = today.minus(AppleAdsAutomationService.ATTRIBUTION_LAG)
            .minusDays(AppleAdsAutomationService.WINDOW_DAYS - 1)
        val endDate = today.minusDays(1)

        val synced = runCatching { reportSyncer.sync(startDate, endDate) }
            .onFailure { log.error(it) { "애플 광고 리포트를 적재하지 못했다. 자동 조치는 건너뛴다." } }
            .isSuccess

        if (!synced) {
            return
        }

        runCatching { automationService.run() }
            .onFailure { log.error(it) { "애플 광고 자동 조치를 돌리지 못했다." } }
    }

    companion object {

        private const val DAILY_CRON = "0 0 6 * * *"
    }
}
