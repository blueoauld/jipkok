package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsNegativeKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import java.math.BigDecimal
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

    fun updateKeyword(
        campaignId: Long,
        adGroupId: Long,
        keywordId: Long,
        status: String?,
        bid: BigDecimal?,
        currency: String?,
    ): AppleAdsKeywordInfo

    fun createKeyword(
        campaignId: Long,
        adGroupId: Long,
        text: String,
        matchType: String,
        bid: BigDecimal,
        currency: String,
    ): AppleAdsKeywordInfo

    fun deleteKeyword(campaignId: Long, adGroupId: Long, keywordId: Long)

    fun createNegativeKeyword(
        campaignId: Long,
        adGroupId: Long,
        text: String,
        matchType: String,
    ): AppleAdsNegativeKeywordInfo

    fun deleteNegativeKeyword(campaignId: Long, adGroupId: Long, negativeKeywordId: Long)
}
