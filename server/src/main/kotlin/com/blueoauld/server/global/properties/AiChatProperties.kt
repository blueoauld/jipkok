package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "ai-chat")
data class AiChatProperties(

    val model: String = "",
    val apiKey: String = "",
)
