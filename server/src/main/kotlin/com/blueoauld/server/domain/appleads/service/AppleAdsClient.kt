package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import java.time.LocalDate

interface AppleAdsClient {

    fun findOrgs(): List<AppleAdsOrg>

    fun findCampaigns(): List<AppleAdsCampaignInfo>

    fun findKeywordDailyRows(campaignId: Long, startDate: LocalDate, endDate: LocalDate): List<AppleAdsKeywordDailyRow>

    fun findSearchTermDailyRows(
        campaignId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<AppleAdsSearchTermDailyRow>
}
