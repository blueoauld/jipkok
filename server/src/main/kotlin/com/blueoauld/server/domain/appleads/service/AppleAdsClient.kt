package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsAdAccount
import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsNegativeKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import java.math.BigDecimal
import java.time.LocalDate

interface AppleAdsClient {

    fun findAdAccounts(): List<AppleAdsAdAccount>

    fun findCampaigns(): List<AppleAdsCampaignInfo>

    fun findKeywordDailyRows(campaignId: Long, startDate: LocalDate, endDate: LocalDate): List<AppleAdsKeywordDailyRow>

    fun findSearchTermDailyRows(
        campaignId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<AppleAdsSearchTermDailyRow>

    fun findKeyword(keywordId: Long): AppleAdsKeywordInfo

    fun updateKeyword(
        keywordId: Long,
        status: String?,
        bid: BigDecimal?,
        currency: String?,
    ): AppleAdsKeywordInfo

    fun createKeyword(
        adGroupId: Long,
        text: String,
        matchType: String,
        bid: BigDecimal,
        currency: String,
    ): AppleAdsKeywordInfo

    fun deleteKeyword(keywordId: Long)

    fun createNegativeKeyword(
        adGroupId: Long,
        text: String,
        matchType: String,
    ): AppleAdsNegativeKeywordInfo

    fun deleteNegativeKeyword(negativeKeywordId: Long)
}
