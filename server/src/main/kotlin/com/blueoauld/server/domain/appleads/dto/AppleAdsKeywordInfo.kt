package com.blueoauld.server.domain.appleads.dto

import java.math.BigDecimal

data class AppleAdsKeywordInfo(

    val id: Long,
    val adGroupId: Long,
    val text: String,
    val matchType: String?,
    val status: String?,
    val bidAmount: BigDecimal?,
    val currency: String?,
)

data class AppleAdsNegativeKeywordInfo(

    val id: Long,
    val adGroupId: Long,
    val text: String,
    val matchType: String?,
    val status: String?,
)
