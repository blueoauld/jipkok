package com.blueoauld.server.domain.member.dto.response

data class SignupResponse(

    val memberId: Long,
    val accessToken: String,
)
