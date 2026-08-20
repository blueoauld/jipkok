package com.blueoauld.server.domain.access.dto

import com.blueoauld.server.domain.push.entity.type.DevicePlatform

data class AccessInfo(

    val platform: DevicePlatform,
    val deviceName: String?,
    val ipAddress: String,
    val appVersion: String?,
)
