package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "cors")
data class CorsProperties(

    val allowedOrigins: List<String> = emptyList(),
)
