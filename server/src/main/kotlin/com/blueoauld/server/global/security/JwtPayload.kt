package com.blueoauld.server.global.security

data class JwtPayload(

    val memberId: Long,
    val role: String,
)
