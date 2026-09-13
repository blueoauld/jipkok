package com.blueoauld.server.global.security

import com.blueoauld.server.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.data.redis.core.StringRedisTemplate
import java.time.Instant
import java.util.concurrent.TimeUnit

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class AccessTokenRevocationCacheTest {

    @Autowired
    private lateinit var accessTokenRevocationCache: AccessTokenRevocationCache

    @Autowired
    private lateinit var jwtProvider: JwtProvider

    @Autowired
    private lateinit var stringRedisTemplate: StringRedisTemplate

    @AfterEach
    fun tearDown() {
        stringRedisTemplate.delete(KEY)
    }

    @Test
    fun `무효화한 적이 없으면 토큰을 막지 않는다`() {
        // when
        val revoked = accessTokenRevocationCache.isRevoked(MEMBER_ID, Instant.now().minusSeconds(3600))

        // then
        assertThat(revoked).isFalse()
    }

    @Test
    fun `무효화하면 그 전에 발급한 토큰만 막고 액세스 토큰 유효기간 동안 기준을 남긴다`() {
        // given
        val now = Instant.now()

        // when
        accessTokenRevocationCache.revokeAll(MEMBER_ID)

        // then
        assertThat(accessTokenRevocationCache.isRevoked(MEMBER_ID, now.minusSeconds(1))).isTrue()
        assertThat(accessTokenRevocationCache.isRevoked(MEMBER_ID, now.plusSeconds(1))).isFalse()
        assertThat(accessTokenRevocationCache.isRevoked(OTHER_MEMBER_ID, now.minusSeconds(1))).isFalse()
        assertThat(stringRedisTemplate.getExpire(KEY, TimeUnit.MINUTES)).isBetween(59L, 60L)
    }

    @Test
    fun `무효화 뒤에는 옛 액세스 토큰을 읽지 않고 새로 발급한 토큰은 읽는다`() {
        // given
        val oldToken = jwtProvider.createAccessToken(MEMBER_ID, ROLE)
        TimeUnit.MILLISECONDS.sleep(SECOND_BOUNDARY_WAIT_MILLIS)

        // when
        accessTokenRevocationCache.revokeAll(MEMBER_ID)
        val newToken = jwtProvider.createAccessToken(MEMBER_ID, ROLE)

        // then
        assertThat(jwtProvider.parseAccessToken(oldToken)).isNull()
        assertThat(jwtProvider.parseAccessToken(newToken)?.memberId).isEqualTo(MEMBER_ID)
    }

    companion object {

        private const val MEMBER_ID = 987_654L
        private const val OTHER_MEMBER_ID = 987_655L
        private const val ROLE = "MEMBER"
        private const val KEY = "access-token:revoked-before:$MEMBER_ID"
        private const val SECOND_BOUNDARY_WAIT_MILLIS = 1_100L
    }
}
