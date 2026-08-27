package com.blueoauld.server.global.repository

import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.script.RedisScript
import java.time.Duration

private val INCREASE_WITH_WINDOW = RedisScript.of(
    """
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return count
    """.trimIndent(),
    Long::class.javaObjectType,
)

fun StringRedisTemplate.increaseWithWindow(key: String, window: Duration): Long =
    execute(INCREASE_WITH_WINDOW, listOf(key), window.seconds.toString()) ?: 0
