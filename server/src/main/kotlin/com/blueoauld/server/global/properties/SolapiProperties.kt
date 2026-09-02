package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "solapi")
data class SolapiProperties(

    val apiKey: String = "",
    val apiSecret: String = "",
    val senderNumber: String = "",
)
