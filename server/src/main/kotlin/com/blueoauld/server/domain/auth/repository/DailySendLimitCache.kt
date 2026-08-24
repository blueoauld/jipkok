package com.blueoauld.server.domain.auth.repository

import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.time.Duration

@Repository
class DailySendLimitCache(

    private val stringRedisTemplate: StringRedisTemplate,
) {

    fun increaseAndCount(): Long {
        val count = stringRedisTemplate.opsForValue().increment(KEY) ?: 0

        if (count == 1L) {
            stringRedisTemplate.expire(KEY, WINDOW)
        }

        return count
    }

    companion object {

        const val DAILY_LIMIT = 500L

        private const val KEY = "verification:daily-count"
        private val WINDOW: Duration = Duration.ofDays(1)
    }
}
