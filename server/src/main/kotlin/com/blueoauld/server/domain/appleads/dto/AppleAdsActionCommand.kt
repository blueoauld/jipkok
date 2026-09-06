package com.blueoauld.server.domain.appleads.dto

import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import java.math.BigDecimal

data class AppleAdsActionCommand(

    val type: AppleAdsActionType,
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
    val reason: String?,
)
