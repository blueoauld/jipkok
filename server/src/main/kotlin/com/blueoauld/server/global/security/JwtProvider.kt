package com.blueoauld.server.global.security

import com.blueoauld.server.global.properties.JwtProperties
import io.jsonwebtoken.Claims
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
            .claim(TYPE_CLAIM, ACCESS_TYPE)
            .claim(ROLE_CLAIM, role)
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(issuedAt.plus(jwtProperties.accessTokenValidity)))
            .signWith(key)
            .compact()
    }

    fun createRefreshToken(memberId: Long): String {
        val issuedAt = clock.instant()

        return Jwts.builder()
            .id(UUID.randomUUID().toString())
            .subject(memberId.toString())
            .claim(TYPE_CLAIM, REFRESH_TYPE)
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(issuedAt.plus(jwtProperties.refreshTokenValidity)))
            .signWith(key)
            .compact()
    }

    fun parseAccessToken(token: String): JwtPayload? {
        val claims = parseClaims(token, ACCESS_TYPE) ?: return null
        val memberId = claims.subject?.toLongOrNull() ?: return null
        val role = claims[ROLE_CLAIM]?.toString() ?: return null

        return JwtPayload(memberId, role)
    }

    fun parseRefreshTokenMemberId(token: String): Long? = parseClaims(token, REFRESH_TYPE)?.subject?.toLongOrNull()

    private fun parseClaims(token: String, type: String): Claims? = runCatching {
        Jwts.parser()
            .verifyWith(key)
            .clock { Date.from(clock.instant()) }
            .build()
            .parseSignedClaims(token)
            .payload
            .takeIf { it[TYPE_CLAIM] == type }
    }.getOrNull()

    companion object {

        const val ROLE_CLAIM = "role"
        const val TYPE_CLAIM = "type"

        private const val ACCESS_TYPE = "access"
        private const val REFRESH_TYPE = "refresh"
    }
}
