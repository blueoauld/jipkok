package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.global.properties.AiChatProperties
import org.springframework.ai.chat.client.ChatClient
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

    override fun generate(context: AiReplyContext): String? {
        val spec = chatClient.prompt().messages(aiPromptBuilder.build(context))

        if (aiChatProperties.model.isNotBlank()) {
            spec.options(OpenAiChatOptions.builder().model(aiChatProperties.model))
        }

        return spec.call().content()?.trim()?.take(ChatMessage.CONTENT_MAX_LENGTH)?.ifEmpty { null }
    }
}
