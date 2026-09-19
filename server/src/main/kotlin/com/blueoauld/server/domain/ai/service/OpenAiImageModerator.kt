package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.global.properties.AiChatProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.http.HttpHeaders
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${spring.ai.openai.api-key:}'.isEmpty()")
class OpenAiImageModerator(

    private val aiChatProperties: AiChatProperties,
) {

    private val restClient = RestClient.builder()
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(CONNECT_TIMEOUT)
                setReadTimeout(READ_TIMEOUT)
            },
        )
        .build()

    fun isSafe(imageUrl: String): Boolean {
        val response = runCatching {
            restClient.post()
                .uri(MODERATION_URL)
                .header(HttpHeaders.AUTHORIZATION, "Bearer ${aiChatProperties.apiKey}")
                .body(
                    mapOf(
                        "model" to MODERATION_MODEL,
                        "input" to listOf(mapOf("type" to IMAGE_URL, IMAGE_URL to mapOf("url" to imageUrl))),
                    ),
                )
                .retrieve()
                .body<ModerationResponseBody>()
        }.onFailure { log.warn(it) { "AI에 넘길 사진을 검수하지 못해 넘기지 않는다." } }
            .getOrNull()

        return response?.results?.firstOrNull()?.flagged == false
    }

    private data class ModerationResponseBody(val results: List<ModerationResult>?)

    private data class ModerationResult(val flagged: Boolean?)

    companion object {

        private const val MODERATION_URL = "https://api.openai.com/v1/moderations"
        private const val MODERATION_MODEL = "omni-moderation-latest"
        private const val IMAGE_URL = "image_url"

        private val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(2)
        private val READ_TIMEOUT: Duration = Duration.ofSeconds(10)
    }
}
