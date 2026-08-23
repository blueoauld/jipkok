package com.blueoauld.server.domain.translation.repository

import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.time.Duration

@Repository
class TranslationLimitCache(

    private val stringRedisTemplate: StringRedisTemplate,
) {

    fun increaseAndCount(memberId: Long): Long {
        val key = key(memberId)
        val count = stringRedisTemplate.opsForValue().increment(key) ?: 0

        if (count == 1L) {
            stringRedisTemplate.expire(key, WINDOW)
        }

        return count
    }

    private fun key(memberId: Long) = "$KEY_PREFIX$memberId"

    companion object {

        const val DAILY_LIMIT = 200L

        private const val KEY_PREFIX = "translation:count:"
        private val WINDOW: Duration = Duration.ofDays(1)
    }
}
