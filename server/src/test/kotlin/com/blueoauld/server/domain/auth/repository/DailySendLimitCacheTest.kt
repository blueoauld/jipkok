package com.blueoauld.server.domain.auth.repository

import com.blueoauld.server.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.data.redis.core.StringRedisTemplate
import java.time.Duration

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class DailySendLimitCacheTest {

    @Autowired
    private lateinit var dailySendLimitCache: DailySendLimitCache

    @Autowired
    private lateinit var stringRedisTemplate: StringRedisTemplate

    @AfterEach
    fun tearDown() {
        stringRedisTemplate.delete(KEY)
    }

    @Test
    fun `부를 때마다 늘어난 수를 돌려준다`() {
        // when
        val first = dailySendLimitCache.increaseAndCount()
        val second = dailySendLimitCache.increaseAndCount()

        // then
        assertThat(first).isEqualTo(1)
        assertThat(second).isEqualTo(2)
    }

    @Test
    fun `첫 증가와 함께 만료 시간을 건다`() {
        // when
        dailySendLimitCache.increaseAndCount()

        // then
        assertThat(stringRedisTemplate.getExpire(KEY)).isPositive()
    }

    @Test
    fun `다음 증가는 만료 시간을 다시 걸지 않는다`() {
        // given
        dailySendLimitCache.increaseAndCount()
        stringRedisTemplate.expire(KEY, Duration.ofSeconds(60))

        // when
        dailySendLimitCache.increaseAndCount()

        // then
        assertThat(stringRedisTemplate.getExpire(KEY)).isLessThanOrEqualTo(60)
    }

    companion object {

        private const val KEY = "verification:daily-count"
    }
}
