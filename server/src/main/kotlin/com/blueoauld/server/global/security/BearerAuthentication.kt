package com.blueoauld.server.global.security

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.authority.SimpleGrantedAuthority

private const val BEARER_PREFIX = "Bearer "
private const val ROLE_PREFIX = "ROLE_"

fun JwtProvider.authenticateBearer(header: String?): Authentication? =
    header
        ?.takeIf { it.startsWith(BEARER_PREFIX) }
        ?.removePrefix(BEARER_PREFIX)
        ?.let(::parseAccessToken)
        ?.let {
            UsernamePasswordAuthenticationToken(
                it.memberId,
                null,
                listOf(SimpleGrantedAuthority(ROLE_PREFIX + it.role)),
            )
        }
