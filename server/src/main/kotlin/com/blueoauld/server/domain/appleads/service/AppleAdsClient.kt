package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg

interface AppleAdsClient {

    fun findOrgs(): List<AppleAdsOrg>
}
