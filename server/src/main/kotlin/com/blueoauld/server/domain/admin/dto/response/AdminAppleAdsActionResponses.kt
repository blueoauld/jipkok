package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import java.math.BigDecimal
import java.time.Instant

data class AdminAppleAdsActionPageResponse(

    val items: List<AdminAppleAdsActionResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminAppleAdsActionResponse(

    val id: Long,
    val actorId: Long?,
    val actorNickname: String?,
    val automatic: Boolean,
    val type: AppleAdsActionType,
    val campaignId: Long,
    val adGroupId: Long,
    val adGroupName: String?,
    val keywordId: Long?,
    val keyword: String?,
    val matchType: String?,
    val searchTerm: String?,
    val negativeKeywordId: Long?,
    val previousBid: BigDecimal?,
    val newBid: BigDecimal?,
    val currency: String?,
    val previousStatus: String?,
    val newStatus: String?,
    val reason: String?,
    val revertedAt: Instant?,
    val revertedById: Long?,
    val revertedByNickname: String?,
    val createdAt: Instant,
)
