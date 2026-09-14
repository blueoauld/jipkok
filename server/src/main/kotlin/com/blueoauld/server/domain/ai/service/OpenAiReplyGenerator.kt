package com.blueoauld.server.domain.ai.service

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

    override fun generate(context: AiReplyContext): AiReply? =
        call(aiPromptBuilder.build(context), ChatMessage.CONTENT_MAX_LENGTH, REPLY_MAX_TOKENS)

    override fun summarize(context: AiSummaryContext): AiReply? =
        call(aiPromptBuilder.buildSummary(context), AiRoomMemory.SUMMARY_MAX_CHARS, SUMMARY_MAX_TOKENS)

    private fun call(messages: List<Message>, maxChars: Int, maxTokens: Int): AiReply? {
        val options = OpenAiChatOptions.builder().maxTokens(maxTokens)

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
            model = response.metadata.model.take(AiReplyLog.MODEL_MAX_LENGTH),
        )
    }

    companion object {

        const val REPLY_MAX_TOKENS = 300
        const val SUMMARY_MAX_TOKENS = 600
    }
}
