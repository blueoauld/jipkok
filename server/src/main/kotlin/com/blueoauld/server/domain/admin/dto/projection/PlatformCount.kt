package com.blueoauld.server.domain.admin.dto.projection

import com.blueoauld.server.domain.push.entity.type.DevicePlatform

interface PlatformCount {

    val platform: DevicePlatform
    val count: Long
}
