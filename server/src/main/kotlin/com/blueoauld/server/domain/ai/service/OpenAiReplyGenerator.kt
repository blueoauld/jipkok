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
        call(aiPromptBuilder.build(context), ChatMessage.CONTENT_MAX_LENGTH)

    override fun summarize(context: AiSummaryContext): AiReply? =
        call(aiPromptBuilder.buildSummary(context), AiRoomMemory.SUMMARY_MAX_CHARS)

    private fun call(messages: List<Message>, maxChars: Int): AiReply? {
        val spec = chatClient.prompt().messages(messages)

        if (aiChatProperties.model.isNotBlank()) {
            spec.options(OpenAiChatOptions.builder().model(aiChatProperties.model))
        }

        val response = spec.call().chatResponse() ?: return null
        val content = response.result?.output?.text?.trim()?.take(maxChars)?.ifEmpty { null } ?: return null
        val usage = response.metadata.usage

        return AiReply(
            content = content,
            promptTokens = usage.promptTokens ?: 0,
            completionTokens = usage.completionTokens ?: 0,
            model = response.metadata.model?.take(AiReplyLog.MODEL_MAX_LENGTH),
        )
    }
}
