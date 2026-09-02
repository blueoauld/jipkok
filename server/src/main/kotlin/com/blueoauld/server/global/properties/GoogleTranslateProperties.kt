package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "google-translate")
data class GoogleTranslateProperties(

    val apiKey: String = "",
)
