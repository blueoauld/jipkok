package com.blueoauld.server.domain.translation.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.properties.GoogleTranslateProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${google-translate.api-key:}'.isEmpty()")
class GoogleTranslator(

    private val properties: GoogleTranslateProperties,
) : Translator {

    private val restClient = RestClient.builder()
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(CONNECT_TIMEOUT)
                setReadTimeout(READ_TIMEOUT)
            },
        )
        .build()

    override fun translate(text: String, targetLocale: MemberLocale): String {
        val response = runCatching {
            restClient.post()
                .uri(TRANSLATE_URL, properties.apiKey)
                .body(TranslateRequestBody(q = text, target = targetLocale.javaLocale.language))
                .retrieve()
                .body<TranslateResponseBody>()
        }.onFailure { log.error(it) { "번역하지 못했다. targetLocale=$targetLocale" } }
            .getOrNull()

        return response?.data?.translations?.firstOrNull()?.translatedText
            ?: throw BusinessException(ErrorCode.TRANSLATE_FAILED)
    }

    private data class TranslateRequestBody(
        val q: String,
        val target: String,
        val format: String = FORMAT_TEXT,
    )

    private data class TranslateResponseBody(val data: TranslateData?)

    private data class TranslateData(val translations: List<TranslatedText>?)

    private data class TranslatedText(val translatedText: String?)

    companion object {

        private const val TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2?key={apiKey}"
        private const val FORMAT_TEXT = "text"

        private val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(2)
        private val READ_TIMEOUT: Duration = Duration.ofSeconds(10)
    }
}
