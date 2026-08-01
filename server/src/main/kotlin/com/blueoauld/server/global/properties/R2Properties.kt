package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties(prefix = "r2")
data class R2Properties(

    val endpoint: String,
    val accessKeyId: String,
    val secretAccessKey: String,
    val bucket: String,
    val publicBaseUrl: String,
    val uploadUrlValidity: Duration,
    val viewUrlValidity: Duration,
)
