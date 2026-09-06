package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsOrgResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsSyncResponse
import com.blueoauld.server.domain.appleads.service.AppleAdsClient
import com.blueoauld.server.domain.appleads.service.AppleAdsReportSyncer
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class AdminAppleAdsService(

    private val appleAdsClient: AppleAdsClient,
    private val reportSyncer: AppleAdsReportSyncer,
) {

    fun findOrgs(): List<AdminAppleAdsOrgResponse> = appleAdsClient.findOrgs().map {
        AdminAppleAdsOrgResponse(
            orgId = it.orgId,
            orgName = it.orgName,
            currency = it.currency,
            timeZone = it.timeZone,
            roleNames = it.roleNames,
        )
    }

    fun syncReports(startDate: LocalDate, endDate: LocalDate): AdminAppleAdsSyncResponse {
        val result = reportSyncer.sync(startDate, endDate)

        return AdminAppleAdsSyncResponse(
            campaigns = result.campaigns,
            keywordRows = result.keywordRows,
            searchTermRows = result.searchTermRows,
        )
    }
}
