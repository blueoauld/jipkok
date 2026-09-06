package com.blueoauld.server.domain.appleads.dto

interface AppleAdsSearchTermSummaryRow : AppleAdsMetricsRow {

    val searchTerm: String
    val searchTermSource: String?
    val countryOrRegion: String?
    val keywordId: Long?
    val keyword: String?
    val matchType: String?
    val campaignId: Long
    val adGroupId: Long
    val adGroupName: String?
}
