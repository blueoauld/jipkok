package com.blueoauld.server.domain.appleads.dto

data class AppleAdsAutomationResult(

    val enabled: Boolean,
    val candidates: Int,
    val applied: Int,
    val failed: Int,
)
