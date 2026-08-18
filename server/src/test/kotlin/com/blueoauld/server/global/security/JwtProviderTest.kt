package com.blueoauld.server.global.security

import com.blueoauld.server.global.properties.JwtProperties
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class JwtProviderTest {

    private val jwtProvider = JwtProvider(
        JwtProperties(SECRET, Duration.ofHours(1), Duration.ofDays(14)),
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `발급한 액세스 토큰에서 회원과 역할을 읽는다`() {
        // given
        val token = jwtProvider.createAccessToken(MEMBER_ID, ROLE)

        // when
        val payload = jwtProvider.parseAccessToken(token)

        // then
        assertThat(payload?.memberId).isEqualTo(MEMBER_ID)
        assertThat(payload?.role).isEqualTo(ROLE)
    }

    @Test
    fun `회원 id가 숫자가 아니면 읽지 않는다`() {
        // given
        val token = accessToken(subject = "not-a-number", role = ROLE)

        // when
        val payload = jwtProvider.parseAccessToken(token)

        // then
        assertThat(payload).isNull()
    }

    @Test
    fun `역할이 없으면 읽지 않는다`() {
        // given
        val token = accessToken(subject = MEMBER_ID.toString(), role = null)

        // when
        val payload = jwtProvider.parseAccessToken(token)

        // then
        assertThat(payload).isNull()
    }

    @Test
    fun `리프레시 토큰은 액세스 토큰으로 읽지 않는다`() {
        // given
        val token = jwtProvider.createRefreshToken(MEMBER_ID)

        // when, then
        assertThat(jwtProvider.parseAccessToken(token)).isNull()
        assertThat(jwtProvider.parseRefreshTokenMemberId(token)).isEqualTo(MEMBER_ID)
    }

    @Test
    fun `만료된 토큰은 읽지 않는다`() {
        // given
        val token = accessToken(subject = MEMBER_ID.toString(), role = ROLE, expiration = NOW.minusSeconds(1))

        // when
        val payload = jwtProvider.parseAccessToken(token)

        // then
        assertThat(payload).isNull()
    }

    @Test
    fun `다른 키로 서명한 토큰은 읽지 않는다`() {
        // given
        val token = accessToken(subject = MEMBER_ID.toString(), role = ROLE, secret = OTHER_SECRET)

        // when
        val payload = jwtProvider.parseAccessToken(token)

        // then
        assertThat(payload).isNull()
    }

    @Test
    fun `토큰 형식이 아니면 읽지 않는다`() {
        // when, then
        assertThat(jwtProvider.parseAccessToken("not-a-jwt")).isNull()
        assertThat(jwtProvider.parseRefreshTokenMemberId("")).isNull()
    }

    private fun accessToken(
        subject: String,
        role: String?,
        expiration: Instant = NOW.plus(Duration.ofHours(1)),
        secret: String = SECRET,
    ): String {
        val builder = Jwts.builder()
            .subject(subject)
            .claim(JwtProvider.TYPE_CLAIM, ACCESS_TYPE)
            .expiration(Date.from(expiration))

        role?.let { builder.claim(JwtProvider.ROLE_CLAIM, it) }

        return builder.signWith(Keys.hmacShaKeyFor(secret.toByteArray())).compact()
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-16T12:00:00Z")

        private const val SECRET = "test-only-secret-key-that-is-long-enough-for-hmac-sha-algorithms"
        private const val OTHER_SECRET = "another-secret-key-that-is-long-enough-for-hmac-sha-algorithms"
        private const val MEMBER_ID = 7L
        private const val ROLE = "MEMBER"
        private const val ACCESS_TYPE = "access"
    }
}
