package com.blueoauld.server.domain.push.dto.request

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import jakarta.validation.constraints.NotBlank

data class RegisterDeviceTokenRequest(

    @field:NotBlank(message = "토큰이 올바르지 않습니다.")
    val token: String,

    val platform: DevicePlatform,

    val locale: MemberLocale? = null,
)
