package com.blueoauld.server.domain.auth.dto.request

import com.blueoauld.server.domain.member.entity.Member
import jakarta.validation.constraints.Pattern

data class LoginRequest(

    @field:Pattern(regexp = Member.PHONE_NUMBER_PATTERN, message = "휴대폰 번호가 올바르지 않습니다.")
    val phoneNumber: String,

    val password: String,
)
