package com.blueoauld.server.domain.appleads.dto

data class AppleAdsAdAccount(

    val adAccountId: Long,
    val name: String,
    val orgId: Long?,
    val currency: String?,
    val timeZone: String?,
    val roleNames: List<String>,
)
