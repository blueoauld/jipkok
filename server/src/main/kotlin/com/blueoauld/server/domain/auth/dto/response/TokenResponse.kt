package com.blueoauld.server.domain.auth.dto.response

data class TokenResponse(

    val accessToken: String,
    val refreshToken: String,
)
