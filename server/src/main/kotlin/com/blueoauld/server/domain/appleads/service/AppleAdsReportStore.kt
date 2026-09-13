package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import com.blueoauld.server.domain.appleads.repository.AppleAdsCampaignRepository
import com.blueoauld.server.domain.appleads.repository.AppleAdsKeywordDailyRepository
import com.blueoauld.server.domain.appleads.repository.AppleAdsSearchTermDailyRepository
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Component
class AppleAdsReportStore(

    private val campaignRepository: AppleAdsCampaignRepository,
    private val keywordDailyRepository: AppleAdsKeywordDailyRepository,
    private val searchTermDailyRepository: AppleAdsSearchTermDailyRepository,
    private val clock: Clock,
) {

    @Transactional
    fun saveCampaigns(campaigns: List<AppleAdsCampaignInfo>) {
        val now = clock.instant()

        campaigns.forEach {
            campaignRepository.upsert(id = it.id, name = it.name, status = it.status, deleted = it.deleted, now = now)
        }
    }

    @Transactional
    fun saveKeywordRows(campaignId: Long, rows: List<AppleAdsKeywordDailyRow>) {
        val now = clock.instant()

        rows.forEach {
            keywordDailyRepository.upsert(
                reportDate = it.metrics.date,
                campaignId = campaignId,
                adGroupId = it.adGroupId,
                adGroupName = it.adGroupName,
                keywordId = it.keywordId,
                keyword = it.keyword,
                matchType = it.matchType,
                keywordStatus = it.keywordStatus,
                deleted = it.deleted,
                bidAmount = it.bidAmount,
                suggestedBidAmount = it.suggestedBidAmount,
                bidMin = it.bidMin,
                bidMax = it.bidMax,
                currency = it.metrics.currency,
                impressions = it.metrics.impressions,
                taps = it.metrics.taps,
                totalInstalls = it.metrics.totalInstalls,
                tapInstalls = it.metrics.tapInstalls,
                viewInstalls = it.metrics.viewInstalls,
                totalNewDownloads = it.metrics.totalNewDownloads,
                totalRedownloads = it.metrics.totalRedownloads,
                spend = it.metrics.spend,
                now = now,
            )
        }
    }

    @Transactional
    fun saveSearchTermRows(campaignId: Long, rows: List<AppleAdsSearchTermDailyRow>) {
        val now = clock.instant()

        rows.forEach {
            searchTermDailyRepository.upsert(
                reportDate = it.metrics.date,
                campaignId = campaignId,
                adGroupId = it.adGroupId,
                adGroupName = it.adGroupName,
                keywordId = it.keywordId,
                keyword = it.keyword,
                matchType = it.matchType,
                searchTerm = it.searchTerm,
                searchTermSource = it.searchTermSource,
                countryOrRegion = it.countryOrRegion,
                currency = it.metrics.currency,
                impressions = it.metrics.impressions,
                taps = it.metrics.taps,
                totalInstalls = it.metrics.totalInstalls,
                tapInstalls = it.metrics.tapInstalls,
                viewInstalls = it.metrics.viewInstalls,
                totalNewDownloads = it.metrics.totalNewDownloads,
                totalRedownloads = it.metrics.totalRedownloads,
                spend = it.metrics.spend,
                now = now,
            )
        }
    }
}
