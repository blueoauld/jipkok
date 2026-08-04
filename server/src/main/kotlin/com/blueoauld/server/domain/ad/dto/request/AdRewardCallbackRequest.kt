package com.blueoauld.server.domain.ad.dto.request

data class AdRewardCallbackRequest(

    val userId: Long?,
    val transactionId: String,
    val keyId: String,
    val signature: String,
)
