package com.blueoauld.server.domain.auth.dto.request

data class LoginRequest(

    val phoneNumber: String,
    val password: String,
)
