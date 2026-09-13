package com.blueoauld.server.domain.auth.repository

import com.blueoauld.server.global.properties.JwtProperties
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.script.RedisScript
import org.springframework.stereotype.Repository

private val DELETE_IF_MATCHES = RedisScript.of(
    """
    if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
    end
    return 0
    """.trimIndent(),
    Long::class.javaObjectType,
)

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

    fun deleteIfMatches(memberId: Long, token: String) {
        stringRedisTemplate.execute(DELETE_IF_MATCHES, listOf(toKey(memberId)), token)
    }

    private fun toKey(memberId: Long) = KEY_PREFIX + memberId

    companion object {

        private const val KEY_PREFIX = "refresh:"
    }
}
