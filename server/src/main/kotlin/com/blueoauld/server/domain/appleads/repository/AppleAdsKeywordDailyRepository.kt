package com.blueoauld.server.domain.appleads.repository

import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

interface AppleAdsKeywordDailyRepository : JpaRepository<AppleAdsKeywordDaily, Long> {

    @Modifying
    @Query(
        value = """
        insert into apple_ads_keyword_daily (
            report_date, campaign_id, ad_group_id, ad_group_name, keyword_id, keyword, match_type, keyword_status,
            bid_amount, suggested_bid_amount, bid_min, bid_max, currency, impressions, taps, total_installs,
            tap_installs, view_installs, total_new_downloads, total_redownloads, spend, created_at, updated_at
        )
        values (
            :reportDate, :campaignId, :adGroupId, :adGroupName, :keywordId, :keyword, :matchType, :keywordStatus,
            :bidAmount, :suggestedBidAmount, :bidMin, :bidMax, :currency, :impressions, :taps, :totalInstalls,
            :tapInstalls, :viewInstalls, :totalNewDownloads, :totalRedownloads, :spend, :now, :now
        )
        on conflict (keyword_id, report_date) do update
        set ad_group_id = excluded.ad_group_id,
            ad_group_name = excluded.ad_group_name,
            keyword = excluded.keyword,
            match_type = excluded.match_type,
            keyword_status = excluded.keyword_status,
            bid_amount = excluded.bid_amount,
            suggested_bid_amount = excluded.suggested_bid_amount,
            bid_min = excluded.bid_min,
            bid_max = excluded.bid_max,
            currency = excluded.currency,
            impressions = excluded.impressions,
            taps = excluded.taps,
            total_installs = excluded.total_installs,
            tap_installs = excluded.tap_installs,
            view_installs = excluded.view_installs,
            total_new_downloads = excluded.total_new_downloads,
            total_redownloads = excluded.total_redownloads,
            spend = excluded.spend,
            updated_at = excluded.updated_at
        """,
        nativeQuery = true,
    )
    fun upsert(
        @Param("reportDate") reportDate: LocalDate,
        @Param("campaignId") campaignId: Long,
        @Param("adGroupId") adGroupId: Long,
        @Param("adGroupName") adGroupName: String?,
        @Param("keywordId") keywordId: Long,
        @Param("keyword") keyword: String,
        @Param("matchType") matchType: String?,
        @Param("keywordStatus") keywordStatus: String?,
        @Param("bidAmount") bidAmount: BigDecimal?,
        @Param("suggestedBidAmount") suggestedBidAmount: BigDecimal?,
        @Param("bidMin") bidMin: BigDecimal?,
        @Param("bidMax") bidMax: BigDecimal?,
        @Param("currency") currency: String?,
        @Param("impressions") impressions: Long,
        @Param("taps") taps: Long,
        @Param("totalInstalls") totalInstalls: Long,
        @Param("tapInstalls") tapInstalls: Long,
        @Param("viewInstalls") viewInstalls: Long,
        @Param("totalNewDownloads") totalNewDownloads: Long,
        @Param("totalRedownloads") totalRedownloads: Long,
        @Param("spend") spend: BigDecimal,
        @Param("now") now: Instant,
    )
}
