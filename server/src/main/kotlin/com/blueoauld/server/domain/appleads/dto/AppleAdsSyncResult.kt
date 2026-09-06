package com.blueoauld.server.domain.appleads.dto

data class AppleAdsSyncResult(

    val campaigns: Int,
    val keywordRows: Int,
    val searchTermRows: Int,
)
