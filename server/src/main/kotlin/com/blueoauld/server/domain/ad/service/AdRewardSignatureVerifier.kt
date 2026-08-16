package com.blueoauld.server.domain.ad.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AdMobProperties
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.security.KeyFactory
import java.security.PublicKey
import java.security.Signature
import java.security.spec.X509EncodedKeySpec
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.util.*
import java.util.concurrent.atomic.AtomicReference
import java.util.concurrent.locks.ReentrantLock

@Component
class AdRewardSignatureVerifier(

    private val adMobProperties: AdMobProperties,
    private val clock: Clock,
) {

    private val restClient = RestClient.builder()
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(CONNECT_TIMEOUT)
                setReadTimeout(READ_TIMEOUT)
            },
        )
        .build()

    private val publicKeys = AtomicReference<Map<String, PublicKey>>(emptyMap())

    private val reloadLock = ReentrantLock()

    private var reloadedAt: Instant? = null

    fun verify(queryString: String, keyId: String, signature: String) {
        val content = queryString.substringBefore(SIGNATURE_PARAMETER)

        if (content == queryString) {
            throw BusinessException(ErrorCode.INVALID_AD_SIGNATURE)
        }

        if (!isValid(content, keyId, signature)) {
            throw BusinessException(ErrorCode.INVALID_AD_SIGNATURE)
        }
    }

    private fun isValid(content: String, keyId: String, signature: String): Boolean {
        val publicKey = publicKey(keyId) ?: return false

        return runCatching {
            Signature.getInstance(ALGORITHM).apply {
                initVerify(publicKey)
                update(content.toByteArray())
            }.verify(Base64.getUrlDecoder().decode(signature))
        }.getOrDefault(false)
    }

    private fun publicKey(keyId: String): PublicKey? = publicKeys.get()[keyId] ?: reload(keyId)

    private fun reload(keyId: String): PublicKey? {
        if (!reloadLock.tryLock()) {
            return null
        }

        return try {
            publicKeys.get()[keyId] ?: fetchIfDue()[keyId]
        } finally {
            reloadLock.unlock()
        }
    }

    private fun fetchIfDue(): Map<String, PublicKey> {
        val now = clock.instant()
        val previous = reloadedAt

        if (previous != null && now.isBefore(previous.plus(RELOAD_INTERVAL))) {
            return publicKeys.get()
        }

        reloadedAt = now

        val response = runCatching {
            restClient.get()
                .uri(adMobProperties.verifierKeysUrl)
                .retrieve()
                .body(VerifierKeys::class.java)
        }.getOrNull() ?: return emptyMap()

        val reloaded = response.keys.associate { it.keyId.toString() to toPublicKey(it.base64) }
        publicKeys.set(reloaded)

        return reloaded
    }

    private fun toPublicKey(base64: String): PublicKey =
        KeyFactory.getInstance(KEY_ALGORITHM).generatePublic(X509EncodedKeySpec(Base64.getDecoder().decode(base64)))

    data class VerifierKeys(val keys: List<VerifierKey>)

    data class VerifierKey(val keyId: Long, val base64: String)

    companion object {

        val RELOAD_INTERVAL: Duration = Duration.ofMinutes(1)

        private val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(2)
        private val READ_TIMEOUT: Duration = Duration.ofSeconds(3)

        private const val SIGNATURE_PARAMETER = "&signature="
        private const val ALGORITHM = "SHA256withECDSA"
        private const val KEY_ALGORITHM = "EC"
    }
}
