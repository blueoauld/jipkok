package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiPromptImage
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.AiRoomMemory
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.global.properties.AiChatProperties
import com.blueoauld.server.global.storage.service.PhotoStorage
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
    private val photoStorage: PhotoStorage,
    private val openAiImageModerator: OpenAiImageModerator,
) : AiReplyGenerator {

    private val chatClient = chatClientBuilder.build()

    override fun generate(context: AiReplyContext): AiReply? {
        val image = imageOf(context)

        if (image != null) {
            runCatching { return reply(context, image) }
                .onFailure { log.warn(it) { "사진을 넣은 AI 응답을 만들지 못해 사진 없이 다시 만든다. aiMemberId=${context.ai.id}" } }
        }

        return reply(context, image = null)
    }

    private fun reply(context: AiReplyContext, image: AiPromptImage?) = call(
        messages = aiPromptBuilder.build(context, image),
        maxChars = ChatMessage.CONTENT_MAX_LENGTH,
        maxTokens = REPLY_MAX_TOKENS,
        language = context.language,
        aiMemberId = context.ai.id,
        noReplyAllowed = true,
    )

    private fun imageOf(context: AiReplyContext): AiPromptImage? {
        val message = imageMessageOf(context) ?: return null
        val objectKey = imageObjectKeyOf(message) ?: return null
        val url = photoStorage.createSignedViewUrl(objectKey)

        return if (openAiImageModerator.isSafe(url)) AiPromptImage(message.id, url) else null
    }

    override fun greet(context: AiGreetingContext): AiReply? = call(
        messages = aiPromptBuilder.buildGreeting(context),
        maxChars = ChatMessage.CONTENT_MAX_LENGTH,
        maxTokens = REPLY_MAX_TOKENS,
        language = context.partner.locale,
        aiMemberId = context.ai.id,
    )

    override fun summarize(context: AiSummaryContext): AiReply? = call(
        messages = aiPromptBuilder.buildSummary(context),
        maxChars = AiRoomMemory.SUMMARY_MAX_CHARS,
        maxTokens = SUMMARY_MAX_TOKENS,
        language = null,
        aiMemberId = context.ai.id,
    )

    private fun call(
        messages: List<Message>,
        maxChars: Int,
        maxTokens: Int,
        language: MemberLocale?,
        aiMemberId: Long,
        noReplyAllowed: Boolean = false,
    ): AiReply? {
        val cacheKey = cacheKeyOf(aiMemberId)
        val first = request(messages, maxChars, maxTokens, cacheKey, noReplyAllowed) ?: return null

        if (language == null || first.skipped || matchesLanguage(first.content, language)) {
            return first
        }

        log.info { "AI 응답의 언어가 어긋나 다시 만든다. aiMemberId=$aiMemberId language=$language" }
        val second = request(messages, maxChars, maxTokens, cacheKey, noReplyAllowed)
        val reply = second?.copy(
            promptTokens = first.promptTokens + second.promptTokens,
            completionTokens = first.completionTokens + second.completionTokens,
            cachedTokens = first.cachedTokens + second.cachedTokens,
            regenerated = true,
        ) ?: first

        if (reply.skipped || matchesLanguage(reply.content, language)) {
            return reply
        }

        log.info { "다시 만든 AI 응답도 언어가 어긋나 다른 언어가 나온 곳에서 자른다. aiMemberId=$aiMemberId language=$language" }

        return cutAtForeign(reply.content, language)?.let { reply.copy(content = it) }
    }

    // 온도는 주지 않는다. gpt-5 계열은 기본값 1만 받고 다른 값을 주면 400으로 거절한다.
    private fun request(
        messages: List<Message>,
        maxChars: Int,
        maxTokens: Int,
        cacheKey: String,
        noReplyAllowed: Boolean,
    ): AiReply? {
        val options = OpenAiChatOptions.builder()
            .maxCompletionTokens(maxTokens)
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
            skipped = noReplyAllowed && AiPromptBuilder.NO_REPLY in content,
        )
    }

    private fun cacheKeyOf(aiMemberId: Long) = "$CACHE_KEY_PREFIX$aiMemberId"

    companion object {

        const val REPLY_MAX_TOKENS = 300
        const val SUMMARY_MAX_TOKENS = 800
        const val CACHE_KEY_PREFIX = "ai-"
    }
}
