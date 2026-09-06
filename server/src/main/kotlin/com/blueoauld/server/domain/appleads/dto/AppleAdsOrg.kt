package com.blueoauld.server.domain.appleads.dto

data class AppleAdsOrg(

    val orgId: Long,
    val orgName: String,
    val currency: String?,
    val timeZone: String?,
    val roleNames: List<String>,
)
