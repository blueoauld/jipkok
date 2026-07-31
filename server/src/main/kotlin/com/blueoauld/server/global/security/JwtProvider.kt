package com.blueoauld.server.global.security

import com.blueoauld.server.global.properties.JwtProperties
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.time.Clock
import java.util.*

@Component
class JwtProvider(

    private val jwtProperties: JwtProperties,
    private val clock: Clock,
) {

    private val key = Keys.hmacShaKeyFor(jwtProperties.secret.toByteArray())

    fun createAccessToken(memberId: Long, role: String): String {
        val issuedAt = clock.instant()

        return Jwts.builder()
            .subject(memberId.toString())
            .claim(ROLE_CLAIM, role)
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(issuedAt.plus(jwtProperties.accessTokenValidity)))
            .signWith(key)
            .compact()
    }

    companion object {

        const val ROLE_CLAIM = "role"
    }
}
