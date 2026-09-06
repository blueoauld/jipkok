package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsOrgResponse
import com.blueoauld.server.domain.appleads.service.AppleAdsClient
import org.springframework.stereotype.Service

@Service
class AdminAppleAdsService(

    private val appleAdsClient: AppleAdsClient,
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
}
