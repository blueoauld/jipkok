package com.blueoauld.server.domain.ad.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AdMobProperties
import com.sun.net.httpserver.HttpServer
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
import java.util.*

class AdRewardSignatureVerifierTest {

    private lateinit var keyPair: KeyPair

    private lateinit var server: HttpServer

    private lateinit var verifier: AdRewardSignatureVerifier

    @BeforeEach
    fun setUp() {
        keyPair = KeyPairGenerator.getInstance("EC").apply {
            initialize(ECGenParameterSpec("secp256r1"))
        }.generateKeyPair()

        server = HttpServer.create(InetSocketAddress(0), 0)
        server.createContext("/keys") { exchange ->
            val body = """{"keys":[{"keyId":$KEY_ID,"base64":"${encodedPublicKey()}"}]}""".toByteArray()
            exchange.responseHeaders.add("Content-Type", "application/json")
            exchange.sendResponseHeaders(200, body.size.toLong())
            exchange.responseBody.use { it.write(body) }
        }
        server.start()

        verifier = AdRewardSignatureVerifier(
            AdMobProperties("http://localhost:${server.address.port}/keys"),
        )
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
            verifier.verify(queryString(signature), "unknown-key-id", signature)
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

        private const val KEY_ID = 3335741209L
        private const val CONTENT = "ad_network=5450213213286189855&reward_amount=30" +
                "&transaction_id=transaction-id&user_id=1"
    }
}
