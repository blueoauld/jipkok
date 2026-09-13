package com.blueoauld.server.domain.admin.dto.response

data class AdminAppleAdsAdAccountResponse(

    val adAccountId: Long,
    val name: String,
    val orgId: Long?,
    val currency: String?,
    val timeZone: String?,
    val roleNames: List<String>,
)
