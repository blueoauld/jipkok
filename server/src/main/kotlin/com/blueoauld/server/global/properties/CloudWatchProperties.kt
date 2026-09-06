package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "cloudwatch")
data class CloudWatchProperties(

    val dashboardName: String = "",
    val region: String = "",
)
