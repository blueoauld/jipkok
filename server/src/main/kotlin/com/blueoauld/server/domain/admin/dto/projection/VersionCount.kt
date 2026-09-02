package com.blueoauld.server.domain.admin.dto.projection

import com.blueoauld.server.domain.push.entity.type.DevicePlatform

interface VersionCount {

    val version: String
    val platform: DevicePlatform
    val count: Long
}
