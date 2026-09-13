package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsAdAccountResponse
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

    fun findAdAccounts(): List<AdminAppleAdsAdAccountResponse> = appleAdsClient.findAdAccounts().map {
        AdminAppleAdsAdAccountResponse(
            adAccountId = it.adAccountId,
            name = it.name,
            orgId = it.orgId,
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
