package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

@Component
@ConditionalOnExpression("'\${apple-ads.client-id:}'.isEmpty()")
class DisabledAppleAdsClient : AppleAdsClient {

    override fun findOrgs(): List<AppleAdsOrg> = throw BusinessException(ErrorCode.APPLE_ADS_NOT_CONFIGURED)
}
