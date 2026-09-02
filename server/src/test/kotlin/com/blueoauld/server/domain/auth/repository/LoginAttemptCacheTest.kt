package com.blueoauld.server.domain.auth.repository

import com.blueoauld.server.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.data.redis.core.StringRedisTemplate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class LoginAttemptCacheTest {

    @Autowired
    private lateinit var loginAttemptCache: LoginAttemptCache

    @Autowired
    private lateinit var stringRedisTemplate: StringRedisTemplate

    @AfterEach
    fun tearDown() {
        stringRedisTemplate.delete(listOf(PHONE_NUMBER_KEY, IP_ADDRESS_KEY))
    }

    @Test
    fun `실패를 세면 번호와 IP가 함께 늘어난다`() {
        // when
        loginAttemptCache.increase(PHONE_NUMBER, IP_ADDRESS)
        loginAttemptCache.increase(PHONE_NUMBER, IP_ADDRESS)

        // then
        val count = loginAttemptCache.find(PHONE_NUMBER, IP_ADDRESS)
        assertThat(count.phoneNumber).isEqualTo(2)
        assertThat(count.ipAddress).isEqualTo(2)
    }

    @Test
    fun `센 적이 없으면 0으로 본다`() {
        // when
        val count = loginAttemptCache.find(PHONE_NUMBER, IP_ADDRESS)

        // then
        assertThat(count.phoneNumber).isZero()
        assertThat(count.ipAddress).isZero()
    }

    @Test
    fun `첫 증가와 함께 만료 시간을 건다`() {
        // when
        loginAttemptCache.increase(PHONE_NUMBER, IP_ADDRESS)

        // then
        assertThat(stringRedisTemplate.getExpire(PHONE_NUMBER_KEY)).isPositive()
        assertThat(stringRedisTemplate.getExpire(IP_ADDRESS_KEY)).isPositive()
    }

    @Test
    fun `로그인에 성공해 지우면 번호만 지우고 IP는 남긴다`() {
        // given
        loginAttemptCache.increase(PHONE_NUMBER, IP_ADDRESS)

        // when
        loginAttemptCache.clear(PHONE_NUMBER)

        // then
        val count = loginAttemptCache.find(PHONE_NUMBER, IP_ADDRESS)
        assertThat(count.phoneNumber).isZero()
        assertThat(count.ipAddress).isEqualTo(1)
    }

    @Test
    fun `다른 번호와 IP는 서로 세지 않는다`() {
        // when
        loginAttemptCache.increase(PHONE_NUMBER, IP_ADDRESS)

        // then
        val other = loginAttemptCache.find("+821099998888", "10.0.0.9")
        assertThat(other.phoneNumber).isZero()
        assertThat(other.ipAddress).isZero()
    }

    companion object {

        private const val PHONE_NUMBER = "+821011112222"
        private const val IP_ADDRESS = "10.0.0.1"

        private const val PHONE_NUMBER_KEY = "login:phone:$PHONE_NUMBER"
        private const val IP_ADDRESS_KEY = "login:ip:$IP_ADDRESS"
    }
}
