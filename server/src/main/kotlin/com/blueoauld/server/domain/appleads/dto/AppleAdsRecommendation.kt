package com.blueoauld.server.domain.appleads.dto

import java.math.BigDecimal

enum class AppleAdsRecommendationType {

    PAUSE_KEYWORD,
    ADD_NEGATIVE_KEYWORD,
    LOWER_BID,
    RAISE_BID,
    ADD_KEYWORD,
}

data class AppleAdsRecommendation(

    val type: AppleAdsRecommendationType,
    val campaignId: Long,
    val adGroupId: Long,
    val adGroupName: String?,
    val keywordId: Long?,
    val keyword: String?,
    val matchType: String?,
    val searchTerm: String?,
    val currentBid: BigDecimal?,
    val suggestedBid: BigDecimal?,
    val currency: String?,
    val impressions: Long,
    val taps: Long,
    val totalInstalls: Long,
    val spend: BigDecimal,
    val costPerInstall: BigDecimal?,
    val reason: String,
)

data class AppleAdsRecommendationResult(

    val baselineCostPerInstall: BigDecimal?,
    val baselineInstalls: Long,
    val baselineSpend: BigDecimal,
    val currency: String?,
    val items: List<AppleAdsRecommendation>,
)
