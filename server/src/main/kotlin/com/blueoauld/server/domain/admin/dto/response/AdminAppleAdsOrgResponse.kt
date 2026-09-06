package com.blueoauld.server.domain.admin.dto.response

data class AdminAppleAdsOrgResponse(

    val orgId: Long,
    val orgName: String,
    val currency: String?,
    val timeZone: String?,
    val roleNames: List<String>,
)
