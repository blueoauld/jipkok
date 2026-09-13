package com.blueoauld.server.domain.admin.dto.projection

import java.time.Instant
import java.time.LocalDate

interface AppleAdsReportStatus {

    val lastSyncedAt: Instant?
    val latestReportDate: LocalDate?
}
