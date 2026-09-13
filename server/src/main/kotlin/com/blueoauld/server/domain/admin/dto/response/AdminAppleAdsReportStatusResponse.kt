package com.blueoauld.server.domain.admin.dto.response

import java.time.Instant
import java.time.LocalDate

data class AdminAppleAdsReportStatusResponse(

    val lastSyncedAt: Instant?,
    val latestReportDate: LocalDate?,
)
