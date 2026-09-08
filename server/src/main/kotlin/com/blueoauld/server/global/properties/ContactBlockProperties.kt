package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "contact-block")
data class ContactBlockProperties(

    val secret: String,
)
