package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsSyncResult
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.time.today
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.LocalDate
import java.time.Period

private val log = KotlinLogging.logger {}

@Service
class AppleAdsReportSyncer(

    private val appleAdsClient: AppleAdsClient,
    private val reportStore: AppleAdsReportStore,
    private val clock: Clock,
) {

    fun sync(startDate: LocalDate, endDate: LocalDate): AppleAdsSyncResult {
        validate(startDate, endDate)

        val campaigns = appleAdsClient.findCampaigns()
        reportStore.saveCampaigns(campaigns)

        var keywordRows = 0
        var searchTermRows = 0

        campaigns.forEach { campaign ->
            val keywords = appleAdsClient.findKeywordDailyRows(campaign.id, startDate, endDate)
            reportStore.saveKeywordRows(campaign.id, keywords)
            keywordRows += keywords.size

            val searchTerms = appleAdsClient.findSearchTermDailyRows(campaign.id, startDate, endDate)
            reportStore.saveSearchTermRows(campaign.id, searchTerms)
            searchTermRows += searchTerms.size
        }

        log.info {
            "애플 광고 리포트를 적재했다. 기간=$startDate~$endDate 캠페인=${campaigns.size} " +
                "키워드=$keywordRows 검색어=$searchTermRows"
        }

        return AppleAdsSyncResult(
            campaigns = campaigns.size,
            keywordRows = keywordRows,
            searchTermRows = searchTermRows,
        )
    }

    private fun validate(startDate: LocalDate, endDate: LocalDate) {
        val today = clock.today()

        if (startDate.isAfter(endDate) ||
            endDate.isAfter(today) ||
            startDate.isBefore(today.minus(MAX_LOOKBACK)) ||
            startDate.plus(MAX_RANGE).isBefore(endDate)
        ) {
            throw BusinessException(ErrorCode.INVALID_APPLE_ADS_REPORT_RANGE)
        }
    }

    companion object {

        val MAX_RANGE: Period = Period.ofDays(90)
        val MAX_LOOKBACK: Period = Period.ofDays(90)
    }
}
