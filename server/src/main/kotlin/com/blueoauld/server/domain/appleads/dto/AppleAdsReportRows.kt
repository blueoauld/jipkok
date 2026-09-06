package com.blueoauld.server.domain.appleads.dto

import java.math.BigDecimal
import java.time.LocalDate

data class AppleAdsDailyMetrics(

    val date: LocalDate,
    val impressions: Long,
    val taps: Long,
    val totalInstalls: Long,
    val tapInstalls: Long,
    val viewInstalls: Long,
    val totalNewDownloads: Long,
    val totalRedownloads: Long,
    val spend: BigDecimal,
    val currency: String?,
)

data class AppleAdsKeywordDailyRow(

    val keywordId: Long,
    val keyword: String,
    val matchType: String?,
    val keywordStatus: String?,
    val bidAmount: BigDecimal?,
    val adGroupId: Long,
    val adGroupName: String?,
    val metrics: AppleAdsDailyMetrics,
)

data class AppleAdsSearchTermDailyRow(

    val searchTerm: String,
    val searchTermSource: String?,
    val countryOrRegion: String?,
    val keywordId: Long?,
    val keyword: String?,
    val matchType: String?,
    val adGroupId: Long,
    val adGroupName: String?,
    val metrics: AppleAdsDailyMetrics,
)
