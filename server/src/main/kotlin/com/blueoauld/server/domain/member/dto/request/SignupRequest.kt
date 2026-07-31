package com.blueoauld.server.domain.member.dto.request

import com.blueoauld.server.domain.member.entity.type.Gender
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class SignupRequest(

    @field:Pattern(regexp = PHONE_NUMBER_PATTERN, message = "휴대폰 번호가 올바르지 않습니다.")
    val phoneNumber: String,

    @field:Pattern(regexp = VERIFICATION_CODE_PATTERN, message = "인증번호가 올바르지 않습니다.")
    val verificationCode: String,

    @field:Size(min = PASSWORD_MIN_LENGTH, max = PASSWORD_MAX_LENGTH, message = "비밀번호는 8자 이상 30자 이하여야 합니다.")
    val password: String,

    val passwordConfirm: String,

    val gender: Gender,
) {

    companion object {

        const val PHONE_NUMBER_PATTERN = "^010\\d{8}$"
        const val VERIFICATION_CODE_PATTERN = "^\\d{6}$"
        const val PASSWORD_MIN_LENGTH = 8
        const val PASSWORD_MAX_LENGTH = 30
    }
}
