package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "discord")
data class DiscordProperties(

    val token: String = "",
    val reportChannelId: String = "",
    val moderationChannelId: String = "",
    val errorChannelId: String = "",
)
