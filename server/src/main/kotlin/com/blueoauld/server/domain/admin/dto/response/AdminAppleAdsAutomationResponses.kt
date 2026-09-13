package com.blueoauld.server.domain.admin.dto.response

import java.math.BigDecimal
import java.time.Instant

data class AdminAppleAdsAutomationResponse(

    val enabled: Boolean,
    val dailyLimit: Int,
    val pauseKeyword: Boolean,
    val addNegativeKeyword: Boolean,
    val lowerBid: Boolean,
    val raiseBid: Boolean,
    val addKeyword: Boolean,
    val maxBid: BigDecimal?,
    val updatedById: Long?,
    val updatedByNickname: String?,
    val updatedAt: Instant,
)

data class AdminAppleAdsAutomationRunResponse(

    val enabled: Boolean,
    val candidates: Int,
    val applied: Int,
    val failed: Int,
    val remaining: Int,
)
