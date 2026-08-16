package com.blueoauld.server.domain.ad.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AdMobProperties
import com.sun.net.httpserver.HttpServer
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.net.InetSocketAddress
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.Signature
import java.security.spec.ECGenParameterSpec
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*
import java.util.concurrent.atomic.AtomicInteger

class AdRewardSignatureVerifierTest {

    private lateinit var keyPair: KeyPair

    private lateinit var server: HttpServer

    private lateinit var verifier: AdRewardSignatureVerifier

    private val requestCount = AtomicInteger()

    @BeforeEach
    fun setUp() {
        keyPair = KeyPairGenerator.getInstance("EC").apply {
            initialize(ECGenParameterSpec("secp256r1"))
        }.generateKeyPair()

        server = HttpServer.create(InetSocketAddress(0), 0)
        server.createContext("/keys") { exchange ->
            requestCount.incrementAndGet()
            val body = """{"keys":[{"keyId":$KEY_ID,"base64":"${encodedPublicKey()}"}]}""".toByteArray()
            exchange.responseHeaders.add("Content-Type", "application/json")
            exchange.sendResponseHeaders(200, body.size.toLong())
            exchange.responseBody.use { it.write(body) }
        }
        server.start()

        verifier = verifier(Clock.fixed(NOW, ZoneOffset.UTC))
    }

    @AfterEach
    fun tearDown() {
        server.stop(0)
    }

    @Test
    fun `구글이 서명한 콜백은 통과한다`() {
        // given
        val signature = sign(CONTENT)

        // when

        // then
        assertDoesNotThrow {
            verifier.verify(queryString(signature), KEY_ID.toString(), signature)
        }
    }

    @Test
    fun `내용이 바뀌면 서명 검증에 실패한다`() {
        // given
        val signature = sign(CONTENT)
        val tampered = "$CONTENT&reward_amount=9999&signature=$signature&key_id=$KEY_ID"

        // when
        val exception = assertThrows(BusinessException::class.java) {
            verifier.verify(tampered, KEY_ID.toString(), signature)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_AD_SIGNATURE)
    }

    @Test
    fun `모르는 키로 서명했으면 실패한다`() {
        // given
        val signature = sign(CONTENT)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            verifier.verify(queryString(signature), UNKNOWN_KEY_ID, signature)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_AD_SIGNATURE)
    }

    @Test
    fun `서명 파라미터가 없으면 실패한다`() {
        // given
        val signature = sign(CONTENT)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            verifier.verify(CONTENT, KEY_ID.toString(), signature)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_AD_SIGNATURE)
    }

    @Test
    fun `모르는 키가 이어져도 구글에는 한 번만 묻는다`() {
        // given
        val signature = sign(CONTENT)

        // when
        repeat(ATTEMPT_COUNT) {
            runCatching { verifier.verify(queryString(signature), UNKNOWN_KEY_ID, signature) }
        }

        // then
        assertThat(requestCount.get()).isEqualTo(1)
    }

    @Test
    fun `간격이 지나면 다시 물어본다`() {
        // given
        val clock = mockk<Clock>()
        every { clock.instant() } returnsMany listOf(NOW, NOW.plus(AdRewardSignatureVerifier.RELOAD_INTERVAL))
        val throttled = verifier(clock)
        val signature = sign(CONTENT)

        // when
        repeat(2) {
            runCatching { throttled.verify(queryString(signature), UNKNOWN_KEY_ID, signature) }
        }

        // then
        assertThat(requestCount.get()).isEqualTo(2)
    }

    private fun verifier(clock: Clock) = AdRewardSignatureVerifier(
        AdMobProperties("http://localhost:${server.address.port}/keys"),
        clock,
    )

    private fun queryString(signature: String) = "$CONTENT&signature=$signature&key_id=$KEY_ID"

    private fun sign(content: String): String {
        val signed = Signature.getInstance("SHA256withECDSA").apply {
            initSign(keyPair.private)
            update(content.toByteArray())
        }.sign()

        return Base64.getUrlEncoder().withoutPadding().encodeToString(signed)
    }

    private fun encodedPublicKey() = Base64.getEncoder().encodeToString(keyPair.public.encoded)

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-16T12:00:00Z")

        private const val KEY_ID = 3335741209L
        private const val UNKNOWN_KEY_ID = "unknown-key-id"
        private const val ATTEMPT_COUNT = 5
        private const val CONTENT = "ad_network=5450213213286189855&reward_amount=30" +
                "&transaction_id=transaction-id&user_id=1"
    }
}
