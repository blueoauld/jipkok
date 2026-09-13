package com.blueoauld.server.domain.appleads.repository

import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordSummaryRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermSummaryRow
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface AppleAdsSummaryRepository : JpaRepository<AppleAdsKeywordDaily, Long> {

    @Query(
        value = """
        select k.keyword_id as keywordId,
               (array_agg(k.keyword order by k.report_date desc))[1] as keyword,
               (array_agg(k.match_type order by k.report_date desc))[1] as matchType,
               (array_agg(k.keyword_status order by k.report_date desc))[1] as keywordStatus,
               bool_or(k.deleted) as deleted,
               (array_agg(k.bid_amount order by k.report_date desc))[1] as bidAmount,
               (array_agg(k.suggested_bid_amount order by k.report_date desc))[1] as suggestedBidAmount,
               (array_agg(k.bid_min order by k.report_date desc))[1] as bidMin,
               (array_agg(k.bid_max order by k.report_date desc))[1] as bidMax,
               (array_agg(k.currency order by k.report_date desc))[1] as currency,
               (array_agg(k.campaign_id order by k.report_date desc))[1] as campaignId,
               (array_agg(k.ad_group_id order by k.report_date desc))[1] as adGroupId,
               (array_agg(k.ad_group_name order by k.report_date desc))[1] as adGroupName,
               sum(k.impressions) as impressions,
               sum(k.taps) as taps,
               sum(k.total_installs) as totalInstalls,
               sum(k.tap_installs) as tapInstalls,
               sum(k.view_installs) as viewInstalls,
               sum(k.total_new_downloads) as totalNewDownloads,
               sum(k.total_redownloads) as totalRedownloads,
               sum(k.spend) as spend
        from apple_ads_keyword_daily k
        where k.report_date between :startDate and :endDate
          and (:campaignId is null or k.campaign_id = :campaignId)
        group by k.keyword_id
        order by spend desc, impressions desc, keywordId
        """,
        nativeQuery = true,
    )
    fun summarizeKeywords(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        @Param("campaignId") campaignId: Long?,
    ): List<AppleAdsKeywordSummaryRow>

    @Query(
        value = """
        select s.search_term as searchTerm,
               s.search_term_source as searchTermSource,
               (array_agg(s.country_or_region order by s.report_date desc))[1] as countryOrRegion,
               s.keyword_id as keywordId,
               (array_agg(s.keyword order by s.report_date desc))[1] as keyword,
               (array_agg(s.match_type order by s.report_date desc))[1] as matchType,
               (array_agg(s.campaign_id order by s.report_date desc))[1] as campaignId,
               s.ad_group_id as adGroupId,
               (array_agg(s.ad_group_name order by s.report_date desc))[1] as adGroupName,
               (array_agg(s.currency order by s.report_date desc))[1] as currency,
               sum(s.impressions) as impressions,
               sum(s.taps) as taps,
               sum(s.total_installs) as totalInstalls,
               sum(s.tap_installs) as tapInstalls,
               sum(s.view_installs) as viewInstalls,
               sum(s.total_new_downloads) as totalNewDownloads,
               sum(s.total_redownloads) as totalRedownloads,
               sum(s.spend) as spend
        from apple_ads_search_term_daily s
        where s.report_date between :startDate and :endDate
          and (:campaignId is null or s.campaign_id = :campaignId)
          and (:source is null or s.search_term_source = :source)
        group by s.search_term, s.search_term_source, s.keyword_id, s.ad_group_id
        order by impressions desc, spend desc, searchTerm
        """,
        nativeQuery = true,
    )
    fun summarizeSearchTerms(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        @Param("campaignId") campaignId: Long?,
        @Param("source") source: String?,
    ): List<AppleAdsSearchTermSummaryRow>
}
