package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.AiRoomMemory
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.global.properties.AiChatProperties
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

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
        cacheKey = cacheKeyOf(context.ai.id),
    )

    override fun greet(context: AiGreetingContext): AiReply? = call(
        messages = aiPromptBuilder.buildGreeting(context),
        maxChars = ChatMessage.CONTENT_MAX_LENGTH,
        maxTokens = REPLY_MAX_TOKENS,
        cacheKey = cacheKeyOf(context.ai.id),
    )

    override fun summarize(context: AiSummaryContext): AiReply? = call(
        messages = aiPromptBuilder.buildSummary(context),
        maxChars = AiRoomMemory.SUMMARY_MAX_CHARS,
        maxTokens = SUMMARY_MAX_TOKENS,
        cacheKey = cacheKeyOf(context.ai.id),
    )

    private fun call(messages: List<Message>, maxChars: Int, maxTokens: Int, cacheKey: String): AiReply? {
        val options = OpenAiChatOptions.builder().maxCompletionTokens(maxTokens).promptCacheKey(cacheKey)

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
    }
}
