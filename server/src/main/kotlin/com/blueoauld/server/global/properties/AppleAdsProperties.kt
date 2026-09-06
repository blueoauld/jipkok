package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "apple-ads")
data class AppleAdsProperties(

    val clientId: String = "",
    val teamId: String = "",
    val keyId: String = "",
    val privateKey: String = "",
    val orgId: String = "",
    val tokenUrl: String = "",
    val apiUrl: String = "",
)
