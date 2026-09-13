package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.dto.projection.AppleAdsReportStatus
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface AppleAdsAdminRepository : JpaRepository<AppleAdsKeywordDaily, Long> {

    @Query(
        """
        select max(k.updatedAt) as lastSyncedAt, max(k.reportDate) as latestReportDate
        from AppleAdsKeywordDaily k
        """,
    )
    fun findReportStatus(): AppleAdsReportStatus
}
