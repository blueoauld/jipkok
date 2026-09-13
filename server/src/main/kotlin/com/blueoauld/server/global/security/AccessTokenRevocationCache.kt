package com.blueoauld.server.global.security

import com.blueoauld.server.global.properties.JwtProperties
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.time.Clock
import java.time.Instant

@Repository
class AccessTokenRevocationCache(

    private val stringRedisTemplate: StringRedisTemplate,
    private val jwtProperties: JwtProperties,
    private val clock: Clock,
) {

    fun revokeAll(memberId: Long) {
        stringRedisTemplate.opsForValue().set(
            toKey(memberId),
            clock.instant().epochSecond.toString(),
            jwtProperties.accessTokenValidity,
        )
    }

    fun isRevoked(memberId: Long, issuedAt: Instant): Boolean {
        val revokedBefore = stringRedisTemplate.opsForValue()[toKey(memberId)]?.toLongOrNull() ?: return false

        return issuedAt.epochSecond < revokedBefore
    }

    private fun toKey(memberId: Long) = KEY_PREFIX + memberId

    companion object {

        private const val KEY_PREFIX = "access-token:revoked-before:"
    }
}
