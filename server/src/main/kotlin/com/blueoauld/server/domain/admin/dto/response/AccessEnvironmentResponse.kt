package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.push.entity.type.DevicePlatform

data class AccessEnvironmentResponse(

    val platforms: Map<DevicePlatform, Long>,
    val versions: List<VersionCountResponse>,
)

data class VersionCountResponse(

    val version: String,
    val platform: DevicePlatform,
    val count: Long,
)
