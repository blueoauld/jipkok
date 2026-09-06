package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendationType
import java.math.BigDecimal

data class AdminAppleAdsRecommendationResponse(

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

data class AdminAppleAdsRecommendationListResponse(

    val baselineCostPerInstall: BigDecimal?,
    val baselineInstalls: Long,
    val baselineSpend: BigDecimal,
    val currency: String?,
    val items: List<AdminAppleAdsRecommendationResponse>,
)
