package com.blueoauld.server.domain.auth.dto.request

import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.entity.Member
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class ResetPasswordRequest(

    @field:Pattern(
        regexp = Member.PHONE_NUMBER_PATTERN,
        message = "휴대폰 번호가 올바르지 않습니다.",
    )
    val phoneNumber: String,

    @field:Pattern(
        regexp = SignupRequest.VERIFICATION_CODE_PATTERN,
        message = "인증번호가 올바르지 않습니다.",
    )
    val verificationCode: String,

    @field:Size(
        min = SignupRequest.PASSWORD_MIN_LENGTH,
        max = SignupRequest.PASSWORD_MAX_LENGTH,
        message = "비밀번호는 8자 이상 30자 이하여야 합니다.",
    )
    val password: String,

    val passwordConfirm: String,
)
