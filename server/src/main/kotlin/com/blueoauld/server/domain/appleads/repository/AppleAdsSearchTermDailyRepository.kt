package com.blueoauld.server.domain.appleads.repository

import com.blueoauld.server.domain.appleads.entity.AppleAdsSearchTermDaily
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

interface AppleAdsSearchTermDailyRepository : JpaRepository<AppleAdsSearchTermDaily, Long> {

    @Modifying
    @Query(
        value = """
        insert into apple_ads_search_term_daily (
            report_date, campaign_id, ad_group_id, ad_group_name, keyword_id, keyword, match_type, search_term,
            search_term_source, country_or_region, currency, impressions, taps, total_installs, tap_installs,
            view_installs, total_new_downloads, total_redownloads, spend, created_at, updated_at
        )
        values (
            :reportDate, :campaignId, :adGroupId, :adGroupName, :keywordId, :keyword, :matchType, :searchTerm,
            :searchTermSource, :countryOrRegion, :currency, :impressions, :taps, :totalInstalls, :tapInstalls,
            :viewInstalls, :totalNewDownloads, :totalRedownloads, :spend, :now, :now
        )
        on conflict (ad_group_id, coalesce(keyword_id, 0), search_term, report_date) do update
        set ad_group_name = excluded.ad_group_name,
            keyword = excluded.keyword,
            match_type = excluded.match_type,
            search_term_source = excluded.search_term_source,
            country_or_region = excluded.country_or_region,
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
        @Param("keywordId") keywordId: Long?,
        @Param("keyword") keyword: String?,
        @Param("matchType") matchType: String?,
        @Param("searchTerm") searchTerm: String,
        @Param("searchTermSource") searchTermSource: String?,
        @Param("countryOrRegion") countryOrRegion: String?,
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
