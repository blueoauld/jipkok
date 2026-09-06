package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.AppleAdsProperties
import com.fasterxml.jackson.annotation.JsonProperty
import io.github.oshai.kotlinlogging.KotlinLogging
import io.jsonwebtoken.Jwts
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.http.MediaType
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.security.KeyFactory
import java.security.PrivateKey
import java.security.spec.PKCS8EncodedKeySpec
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.util.*

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${apple-ads.client-id:}'.isEmpty()")
class AppleAdsTokenProvider(

    private val properties: AppleAdsProperties,
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

    private val privateKey = parsePrivateKey(properties.privateKey)

    @Volatile
    private var cached: AccessToken? = null

    fun accessToken(): String {
        val now = clock.instant()

        cached?.takeIf { it.isUsableAt(now) }?.let { return it.value }

        return synchronized(this) {
            cached?.takeIf { it.isUsableAt(now) } ?: fetch(now).also { cached = it }
        }.value
    }

    private fun fetch(now: Instant): AccessToken {
        val form = LinkedMultiValueMap<String, String>().apply {
            add(GRANT_TYPE, CLIENT_CREDENTIALS)
            add(CLIENT_ID, properties.clientId)
            add(CLIENT_SECRET, clientSecret(now))
            add(SCOPE, SEARCH_ADS_SCOPE)
        }

        val response = runCatching {
            restClient.post()
                .uri(properties.tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body<TokenResponse>()
        }.onFailure { log.error(it) { "애플 광고 토큰을 받지 못했다." } }
            .getOrNull()

        val value = response?.accessToken ?: throw BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)
        val expiresIn = response.expiresIn ?: DEFAULT_TOKEN_VALIDITY.seconds

        return AccessToken(value, now.plusSeconds(expiresIn))
    }

    private fun clientSecret(now: Instant): String = Jwts.builder()
        .header().keyId(properties.keyId).and()
        .issuer(properties.teamId)
        .subject(properties.clientId)
        .audience().add(AUDIENCE).and()
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(CLIENT_SECRET_VALIDITY)))
        .signWith(privateKey, Jwts.SIG.ES256)
        .compact()

    private data class AccessToken(val value: String, val expiresAt: Instant) {

        fun isUsableAt(now: Instant) = now.isBefore(expiresAt.minus(REFRESH_MARGIN))
    }

    private data class TokenResponse(
        @JsonProperty("access_token") val accessToken: String?,
        @JsonProperty("expires_in") val expiresIn: Long?,
    )

    companion object {

        val REFRESH_MARGIN: Duration = Duration.ofMinutes(1)

        private const val AUDIENCE = "https://appleid.apple.com"
        private const val GRANT_TYPE = "grant_type"
        private const val CLIENT_CREDENTIALS = "client_credentials"
        private const val CLIENT_ID = "client_id"
        private const val CLIENT_SECRET = "client_secret"
        private const val SCOPE = "scope"
        private const val SEARCH_ADS_SCOPE = "searchadsorg"
        private const val KEY_ALGORITHM = "EC"
        private const val PEM_BOUNDARY = "-----"

        private val CLIENT_SECRET_VALIDITY: Duration = Duration.ofMinutes(5)
        private val DEFAULT_TOKEN_VALIDITY: Duration = Duration.ofHours(1)
        private val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(2)
        private val READ_TIMEOUT: Duration = Duration.ofSeconds(10)

        fun parsePrivateKey(pem: String): PrivateKey {
            val base64 = pem.lines()
                .filterNot { it.startsWith(PEM_BOUNDARY) }
                .joinToString("")
                .filterNot { it.isWhitespace() }

            return runCatching {
                KeyFactory.getInstance(
                    KEY_ALGORITHM,
                ).generatePrivate(PKCS8EncodedKeySpec(Base64.getDecoder().decode(base64)))
            }.getOrElse {
                throw IllegalStateException("apple-ads.private-key는 PKCS#8 형식의 EC 개인키여야 한다.", it)
            }
        }
    }
}
