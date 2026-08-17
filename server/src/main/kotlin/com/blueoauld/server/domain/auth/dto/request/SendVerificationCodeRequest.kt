package com.blueoauld.server.domain.auth.dto.request

import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import jakarta.validation.constraints.Pattern

data class SendVerificationCodeRequest(

    @field:Pattern(regexp = PHONE_NUMBER_PATTERN, message = "휴대폰 번호가 올바르지 않습니다.")
    val phoneNumber: String,

    val purpose: VerificationPurpose = VerificationPurpose.SIGNUP,
) {

    companion object {

        const val PHONE_NUMBER_PATTERN = "^010\\d{8}$"
    }
}
