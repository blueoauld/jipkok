package com.blueoauld.server.domain.admin.dto.request

import com.blueoauld.server.domain.appleads.entity.AppleAdsAutomation
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal

data class UpdateAppleAdsAutomationRequest(

    @field:NotNull(message = "자동 실행 여부가 올바르지 않습니다.")
    val enabled: Boolean? = null,

    @field:NotNull(message = "하루 한도가 올바르지 않습니다.")
    @field:Min(value = 0, message = "하루 한도가 올바르지 않습니다.")
    @field:Max(value = AppleAdsAutomation.MAX_DAILY_LIMIT.toLong(), message = "하루 한도는 50까지입니다.")
    val dailyLimit: Int? = null,

    @field:NotNull(message = "유형 설정이 올바르지 않습니다.")
    val pauseKeyword: Boolean? = null,

    @field:NotNull(message = "유형 설정이 올바르지 않습니다.")
    val addNegativeKeyword: Boolean? = null,

    @field:NotNull(message = "유형 설정이 올바르지 않습니다.")
    val lowerBid: Boolean? = null,

    @field:NotNull(message = "유형 설정이 올바르지 않습니다.")
    val raiseBid: Boolean? = null,

    @field:NotNull(message = "유형 설정이 올바르지 않습니다.")
    val addKeyword: Boolean? = null,

    @field:DecimalMin(value = "0.01", message = "최대 입찰가가 올바르지 않습니다.")
    @field:Digits(integer = 6, fraction = 2, message = "최대 입찰가는 소수점 둘째 자리까지입니다.")
    val maxBid: BigDecimal? = null,
)
