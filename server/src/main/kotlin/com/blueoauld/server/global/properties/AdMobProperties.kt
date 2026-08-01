package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "admob")
data class AdMobProperties(

    val verifierKeysUrl: String,
)
