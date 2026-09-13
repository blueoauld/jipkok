package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsAdAccount
import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsNegativeKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.time.LocalDate

@Component
@ConditionalOnExpression("'\${apple-ads.client-id:}'.isEmpty()")
class DisabledAppleAdsClient : AppleAdsClient {

    override fun findAdAccounts(): List<AppleAdsAdAccount> = throw notConfigured()

    override fun findCampaigns(): List<AppleAdsCampaignInfo> = throw notConfigured()

    override fun findKeywordDailyRows(
        campaignId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<AppleAdsKeywordDailyRow> = throw notConfigured()

    override fun findSearchTermDailyRows(
        campaignId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
    ): List<AppleAdsSearchTermDailyRow> = throw notConfigured()

    override fun findKeyword(keywordId: Long): AppleAdsKeywordInfo = throw notConfigured()

    override fun updateKeyword(
        keywordId: Long,
        status: String?,
        bid: BigDecimal?,
        currency: String?,
    ): AppleAdsKeywordInfo = throw notConfigured()

    override fun createKeyword(
        adGroupId: Long,
        text: String,
        matchType: String,
        bid: BigDecimal,
        currency: String,
    ): AppleAdsKeywordInfo = throw notConfigured()

    override fun deleteKeyword(keywordId: Long): Unit = throw notConfigured()

    override fun createNegativeKeyword(
        adGroupId: Long,
        text: String,
        matchType: String,
    ): AppleAdsNegativeKeywordInfo = throw notConfigured()

    override fun deleteNegativeKeyword(negativeKeywordId: Long): Unit = throw notConfigured()

    private fun notConfigured() = BusinessException(ErrorCode.APPLE_ADS_NOT_CONFIGURED)
}
