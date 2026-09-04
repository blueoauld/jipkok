package com.blueoauld.server.domain.translation.repository

import com.blueoauld.server.global.repository.increaseWithWindow
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.time.Duration

@Repository
class TranslationLimitCache(

    private val stringRedisTemplate: StringRedisTemplate,
) {

    fun increaseAndCount(memberId: Long): Long =
        stringRedisTemplate.increaseWithWindow(key(memberId), WINDOW)

    fun decrease(memberId: Long) {
        stringRedisTemplate.opsForValue().decrement(key(memberId))
    }

    private fun key(memberId: Long) = "$KEY_PREFIX$memberId"

    companion object {

        const val DAILY_LIMIT = 20L

        private const val KEY_PREFIX = "translation:count:"
        private val WINDOW: Duration = Duration.ofDays(1)
    }
}
