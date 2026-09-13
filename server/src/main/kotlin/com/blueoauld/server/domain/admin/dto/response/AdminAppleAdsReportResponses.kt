package com.blueoauld.server.domain.admin.dto.response

import java.math.BigDecimal

data class AdminAppleAdsCampaignResponse(

    val id: Long,
    val name: String,
    val status: String?,
    val deleted: Boolean,
)

data class AdminAppleAdsMetricsResponse(

    val impressions: Long,
    val taps: Long,
    val totalInstalls: Long,
    val tapInstalls: Long,
    val viewInstalls: Long,
    val totalNewDownloads: Long,
    val totalRedownloads: Long,
    val spend: BigDecimal,
    val currency: String?,
    val tapThroughRate: Double?,
    val costPerTap: BigDecimal?,
    val costPerInstall: BigDecimal?,
    val conversionRate: Double?,
)

data class AdminAppleAdsKeywordResponse(

    val keywordId: Long,
    val keyword: String,
    val matchType: String?,
    val keywordStatus: String?,
    val deleted: Boolean,
    val bidAmount: BigDecimal?,
    val campaignId: Long,
    val adGroupId: Long,
    val adGroupName: String?,
    val metrics: AdminAppleAdsMetricsResponse,
)

data class AdminAppleAdsKeywordListResponse(

    val items: List<AdminAppleAdsKeywordResponse>,
    val total: AdminAppleAdsMetricsResponse,
)

data class AdminAppleAdsSearchTermResponse(

    val searchTerm: String,
    val searchTermSource: String?,
    val countryOrRegion: String?,
    val keywordId: Long?,
    val keyword: String?,
    val matchType: String?,
    val campaignId: Long,
    val adGroupId: Long,
    val adGroupName: String?,
    val metrics: AdminAppleAdsMetricsResponse,
)

data class AdminAppleAdsSearchTermListResponse(

    val items: List<AdminAppleAdsSearchTermResponse>,
    val total: AdminAppleAdsMetricsResponse,
)
