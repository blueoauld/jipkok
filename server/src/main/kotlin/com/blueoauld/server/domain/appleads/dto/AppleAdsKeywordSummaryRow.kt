package com.blueoauld.server.domain.appleads.dto

import java.math.BigDecimal

interface AppleAdsKeywordSummaryRow : AppleAdsMetricsRow {

    val keywordId: Long
    val keyword: String
    val matchType: String?
    val keywordStatus: String?
    val bidAmount: BigDecimal?
    val suggestedBidAmount: BigDecimal?
    val bidMin: BigDecimal?
    val bidMax: BigDecimal?
    val campaignId: Long
    val adGroupId: Long
    val adGroupName: String?
}
