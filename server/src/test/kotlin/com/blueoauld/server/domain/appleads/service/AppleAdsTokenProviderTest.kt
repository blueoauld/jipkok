package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AppleAdsProperties
import com.sun.net.httpserver.HttpServer
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jws
import io.jsonwebtoken.Jwts
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.net.InetSocketAddress
import java.net.URLDecoder
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.spec.ECGenParameterSpec
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

class AppleAdsTokenProviderTest {

    private lateinit var keyPair: KeyPair

    private lateinit var server: HttpServer

    private val requestCount = AtomicInteger()

    private val lastForm = AtomicReference<Map<String, String>>(emptyMap())

    private var responseStatus = 200

    @BeforeEach
    fun setUp() {
        keyPair = KeyPairGenerator.getInstance("EC").apply {
            initialize(ECGenParameterSpec("secp256r1"))
        }.generateKeyPair()

        server = HttpServer.create(InetSocketAddress(0), 0)
        server.createContext("/token") { exchange ->
            requestCount.incrementAndGet()
            lastForm.set(parseForm(exchange.requestBody.readAllBytes().decodeToString()))
            val body = tokenBody(requestCount.get()).toByteArray()
            exchange.responseHeaders.add("Content-Type", "application/json")
            exchange.sendResponseHeaders(responseStatus, body.size.toLong())
            exchange.responseBody.use { it.write(body) }
        }
        server.start()
    }

    @AfterEach
    fun tearDown() {
        server.stop(0)
    }

    @Test
    fun `클라이언트 시크릿은 등록한 키로 서명한 JWT다`() {
        // given
        val provider = provider(Clock.fixed(NOW, ZoneOffset.UTC))

        // when
        val token = provider.accessToken()

        // then
        assertThat(token).isEqualTo("token-1")
        assertThat(lastForm.get()["grant_type"]).isEqualTo("client_credentials")
        assertThat(lastForm.get()["client_id"]).isEqualTo(CLIENT_ID)
        assertThat(lastForm.get()["scope"]).isEqualTo("searchadsorg")

        val secret = parseClientSecret(lastForm.get().getValue("client_secret"))
        assertThat(secret.header.keyId).isEqualTo(KEY_ID)
        assertThat(secret.payload.issuer).isEqualTo(TEAM_ID)
        assertThat(secret.payload.subject).isEqualTo(CLIENT_ID)
        assertThat(secret.payload.audience).containsExactly("https://appleid.apple.com")
        assertThat(secret.payload.issuedAt).isEqualTo(Date.from(NOW))
    }

    @Test
    fun `만료 전에는 받아 둔 토큰을 다시 쓴다`() {
        // given
        val provider = provider(Clock.fixed(NOW, ZoneOffset.UTC))

        // when
        val first = provider.accessToken()
        val second = provider.accessToken()

        // then
        assertThat(first).isEqualTo(second)
        assertThat(requestCount.get()).isEqualTo(1)
    }

    @Test
    fun `만료가 가까우면 새로 받는다`() {
        // given
        val clock = mockk<Clock>()
        every { clock.instant() } returnsMany listOf(
            NOW,
            NOW.plusSeconds(EXPIRES_IN).minus(AppleAdsTokenProvider.REFRESH_MARGIN),
        )
        val provider = provider(clock)

        // when
        val first = provider.accessToken()
        val second = provider.accessToken()

        // then
        assertThat(first).isEqualTo("token-1")
        assertThat(second).isEqualTo("token-2")
    }

    @Test
    fun `토큰을 받지 못하면 실패한다`() {
        // given
        responseStatus = 500
        val provider = provider(Clock.fixed(NOW, ZoneOffset.UTC))

        // when
        val exception = assertThrows(BusinessException::class.java) { provider.accessToken() }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.APPLE_ADS_UNAVAILABLE)
    }

    @Test
    fun `PEM 머리말이 붙은 개인키도 읽는다`() {
        // given
        val lines = encodedPrivateKey().chunked(PEM_LINE_LENGTH).joinToString("\n")
        val pem = "-----BEGIN PRIVATE KEY-----\n$lines\n-----END PRIVATE KEY-----\n"

        // when
        val parsed = AppleAdsTokenProvider.parsePrivateKey(pem)

        // then
        assertThat(parsed).isEqualTo(keyPair.private)
    }

    @Test
    fun `개인키 형식이 틀리면 기동하지 못한다`() {
        // given
        val properties = properties(privateKey = "not-a-key")

        // when

        // then
        assertThrows(IllegalStateException::class.java) {
            AppleAdsTokenProvider(properties, Clock.fixed(NOW, ZoneOffset.UTC))
        }
    }

    private fun provider(clock: Clock) = AppleAdsTokenProvider(properties(encodedPrivateKey()), clock)

    private fun properties(privateKey: String) = AppleAdsProperties(
        clientId = CLIENT_ID,
        teamId = TEAM_ID,
        keyId = KEY_ID,
        privateKey = privateKey,
        tokenUrl = "http://localhost:${server.address.port}/token",
        apiUrl = "http://localhost:${server.address.port}",
    )

    private fun parseClientSecret(secret: String): Jws<Claims> = Jwts.parser()
        .verifyWith(keyPair.public)
        .clock { Date.from(NOW) }
        .build()
        .parseSignedClaims(secret)

    private fun parseForm(body: String): Map<String, String> = body.split("&").associate {
        val (key, value) = it.split("=", limit = 2)
        URLDecoder.decode(key, Charsets.UTF_8) to URLDecoder.decode(value, Charsets.UTF_8)
    }

    private fun encodedPrivateKey() = Base64.getEncoder().encodeToString(keyPair.private.encoded)

    private fun tokenBody(count: Int) =
        """{"access_token":"token-$count","token_type":"Bearer","expires_in":$EXPIRES_IN}"""

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-06T12:00:00Z")

        private const val CLIENT_ID = "SEARCHADS.client-id"
        private const val TEAM_ID = "SEARCHADS.team-id"
        private const val KEY_ID = "key-id"
        private const val EXPIRES_IN = 3600L
        private const val PEM_LINE_LENGTH = 64
    }
}
