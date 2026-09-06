package com.blueoauld.server.domain.admin.dto.projection

import java.math.BigDecimal

interface AppleAdsKeywordSummaryRow : AppleAdsMetricsRow {

    val keywordId: Long
    val keyword: String
    val matchType: String?
    val keywordStatus: String?
    val bidAmount: BigDecimal?
    val campaignId: Long
    val adGroupId: Long
    val adGroupName: String?
}
