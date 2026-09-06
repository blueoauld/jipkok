package com.blueoauld.server.domain.admin.dto.request

import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import java.math.BigDecimal

data class ApplyAppleAdsActionRequest(

    @field:NotNull(message = "조치 유형이 올바르지 않습니다.")
    val type: AppleAdsActionType? = null,

    @field:NotNull(message = "캠페인 ID가 올바르지 않습니다.")
    val campaignId: Long? = null,

    @field:NotNull(message = "광고그룹 ID가 올바르지 않습니다.")
    val adGroupId: Long? = null,

    @field:Size(max = AppleAdsKeywordDaily.NAME_MAX_LENGTH, message = "광고그룹 이름이 너무 깁니다.")
    val adGroupName: String? = null,

    val keywordId: Long? = null,

    @field:Size(max = AppleAdsKeywordDaily.NAME_MAX_LENGTH, message = "키워드가 너무 깁니다.")
    val keyword: String? = null,

    @field:Size(max = AppleAdsKeywordDaily.TYPE_MAX_LENGTH, message = "일치 유형이 올바르지 않습니다.")
    val matchType: String? = null,

    @field:Size(max = AppleAdsKeywordDaily.NAME_MAX_LENGTH, message = "검색어가 너무 깁니다.")
    val searchTerm: String? = null,

    @field:Positive(message = "입찰가가 올바르지 않습니다.")
    val currentBid: BigDecimal? = null,

    @field:Positive(message = "입찰가가 올바르지 않습니다.")
    val suggestedBid: BigDecimal? = null,

    @field:Size(max = AppleAdsKeywordDaily.CURRENCY_LENGTH, message = "통화가 올바르지 않습니다.")
    val currency: String? = null,

    @field:Size(max = AppleAdsAction.REASON_MAX_LENGTH, message = "근거가 너무 깁니다.")
    val reason: String? = null,
)
