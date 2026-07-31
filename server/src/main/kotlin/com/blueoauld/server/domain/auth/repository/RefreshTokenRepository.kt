package com.blueoauld.server.domain.auth.repository

import com.blueoauld.server.global.properties.JwtProperties
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository

@Repository
class RefreshTokenRepository(

    private val stringRedisTemplate: StringRedisTemplate,
    private val jwtProperties: JwtProperties,
) {

    fun save(memberId: Long, token: String) {
        stringRedisTemplate.opsForValue().set(
            toKey(memberId),
            token,
            jwtProperties.refreshTokenValidity,
        )
    }

    fun findToken(memberId: Long): String? = stringRedisTemplate.opsForValue()[toKey(memberId)]

    fun delete(memberId: Long) {
        stringRedisTemplate.delete(toKey(memberId))
    }

    private fun toKey(memberId: Long) = KEY_PREFIX + memberId

    companion object {

        private const val KEY_PREFIX = "refresh:"
    }
}
