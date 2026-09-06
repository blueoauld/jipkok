package com.blueoauld.server.domain.appleads.dto

data class AppleAdsCampaignInfo(

    val id: Long,
    val name: String,
    val status: String?,
    val deleted: Boolean,
)
