package com.blueoauld.server.domain.member.dto.request

import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin

data class HeartbeatRequest(

    @field:DecimalMin(value = "-90.0", message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMax(value = "90.0", message = "위치 정보가 올바르지 않습니다.")
    val latitude: Double? = null,

    @field:DecimalMin(value = "-180.0", message = "위치 정보가 올바르지 않습니다.")
    @field:DecimalMax(value = "180.0", message = "위치 정보가 올바르지 않습니다.")
    val longitude: Double? = null,
)
