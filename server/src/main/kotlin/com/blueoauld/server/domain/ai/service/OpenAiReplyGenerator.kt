package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.AiRoomMemory
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.global.properties.AiChatProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${spring.ai.openai.api-key:}'.isEmpty()")
class OpenAiReplyGenerator(

    chatClientBuilder: ChatClient.Builder,
    private val aiChatProperties: AiChatProperties,
    private val aiPromptBuilder: AiPromptBuilder,
) : AiReplyGenerator {

    private val chatClient = chatClientBuilder.build()

    override fun generate(context: AiReplyContext): AiReply? = call(
        messages = aiPromptBuilder.build(context),
        maxChars = ChatMessage.CONTENT_MAX_LENGTH,
        maxTokens = REPLY_MAX_TOKENS,
        temperature = REPLY_TEMPERATURE,
        language = context.language,
        aiMemberId = context.ai.id,
    )

    override fun greet(context: AiGreetingContext): AiReply? = call(
        messages = aiPromptBuilder.buildGreeting(context),
        maxChars = ChatMessage.CONTENT_MAX_LENGTH,
        maxTokens = REPLY_MAX_TOKENS,
        temperature = REPLY_TEMPERATURE,
        language = context.partner.locale,
        aiMemberId = context.ai.id,
    )

    override fun summarize(context: AiSummaryContext): AiReply? = call(
        messages = aiPromptBuilder.buildSummary(context),
        maxChars = AiRoomMemory.SUMMARY_MAX_CHARS,
        maxTokens = SUMMARY_MAX_TOKENS,
        temperature = SUMMARY_TEMPERATURE,
        language = null,
        aiMemberId = context.ai.id,
    )

    // 다른 언어 글자가 섞여 나오면 한 번만 다시 만들어 보고, 그래도 어긋나면 나온 대로 쓴다.
    private fun call(
        messages: List<Message>,
        maxChars: Int,
        maxTokens: Int,
        temperature: Double,
        language: MemberLocale?,
        aiMemberId: Long,
    ): AiReply? {
        val cacheKey = cacheKeyOf(aiMemberId)
        val first = request(messages, maxChars, maxTokens, temperature, cacheKey) ?: return null

        if (language == null || matchesLanguage(first.content, language)) {
            return first
        }

        log.info { "AI 응답의 언어가 어긋나 다시 만든다. aiMemberId=$aiMemberId language=$language" }
        val second = request(messages, maxChars, maxTokens, temperature, cacheKey) ?: return first

        return second.copy(
            promptTokens = first.promptTokens + second.promptTokens,
            completionTokens = first.completionTokens + second.completionTokens,
            cachedTokens = first.cachedTokens + second.cachedTokens,
        )
    }

    private fun request(
        messages: List<Message>,
        maxChars: Int,
        maxTokens: Int,
        temperature: Double,
        cacheKey: String,
    ): AiReply? {
        val options = OpenAiChatOptions.builder()
            .maxCompletionTokens(maxTokens)
            .temperature(temperature)
            .promptCacheKey(cacheKey)

        if (aiChatProperties.model.isNotBlank()) {
            options.model(aiChatProperties.model)
        }

        val response = chatClient.prompt().messages(messages).options(options).call().chatResponse() ?: return null
        val content = response.result?.output?.text?.trim()?.take(maxChars)?.ifEmpty { null } ?: return null
        val usage = response.metadata.usage

        return AiReply(
            content = content,
            promptTokens = usage.promptTokens,
            completionTokens = usage.completionTokens,
            cachedTokens = usage.cacheReadInputTokens?.toInt() ?: 0,
            model = response.metadata.model.take(AiReplyLog.MODEL_MAX_LENGTH),
        )
    }

    private fun cacheKeyOf(aiMemberId: Long) = "$CACHE_KEY_PREFIX$aiMemberId"

    companion object {

        const val REPLY_MAX_TOKENS = 300
        const val SUMMARY_MAX_TOKENS = 800
        const val CACHE_KEY_PREFIX = "ai-"

        // 사람 같은 말투를 남기되 다른 언어 글자가 튀지 않을 만큼 낮춘다. 요약은 사실 정리라 더 낮다.
        const val REPLY_TEMPERATURE = 0.7
        const val SUMMARY_TEMPERATURE = 0.3
    }
}
