package com.blueoauld.server.domain.member.dto.request

import com.blueoauld.server.domain.access.entity.AccessLog
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class HeartbeatRequest(

    @field:NotNull(message = "기기 정보가 올바르지 않습니다.")
    val platform: DevicePlatform? = null,

    @field:Size(max = AccessLog.DEVICE_NAME_MAX_LENGTH, message = "기기 정보가 올바르지 않습니다.")
    val deviceName: String? = null,

    @field:DecimalMin(value = "-90.0", message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMax(value = "90.0", message = "위치 정보가 올바르지 않습니다.")
    val latitude: Double? = null,

    @field:DecimalMin(value = "-180.0", message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMax(value = "180.0", message = "위치 정보가 올바르지 않습니다.")
    val longitude: Double? = null,
)
