package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import java.time.LocalDate

@Component
@ConditionalOnExpression("'\${apple-ads.client-id:}'.isEmpty()")
class DisabledAppleAdsClient : AppleAdsClient {

    override fun findOrgs(): List<AppleAdsOrg> = throw notConfigured()

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

    private fun notConfigured() = BusinessException(ErrorCode.APPLE_ADS_NOT_CONFIGURED)
}
