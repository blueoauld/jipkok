package com.blueoauld.server.domain.appleads.dto

import java.math.BigDecimal

interface AppleAdsMetricsRow {

    val impressions: Long
    val taps: Long
    val totalInstalls: Long
    val tapInstalls: Long
    val viewInstalls: Long
    val totalNewDownloads: Long
    val totalRedownloads: Long
    val spend: BigDecimal
    val currency: String?
}
