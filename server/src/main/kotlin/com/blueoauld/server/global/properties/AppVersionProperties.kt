package com.blueoauld.server.global.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app-version")
data class AppVersionProperties(

    val ios: Store,
    val android: Store,
) {

    data class Store(

        val latest: String,
        val url: String,
    )
}
