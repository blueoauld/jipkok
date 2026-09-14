package com.blueoauld.server.domain.ai.dto.request

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class AiTestChatRequest(

    @field:Size(max = AiPersona.SYSTEM_PROMPT_MAX_LENGTH, message = "페르소나가 너무 깁니다.")
    val systemPrompt: String? = null,

    val locale: MemberLocale = MemberLocale.DEFAULT,

    @field:Valid
    @field:NotEmpty(message = "메시지가 없습니다.")
    @field:Size(max = AiReplyContext.MAX_MESSAGES, message = "메시지는 30개까지 보낼 수 있습니다.")
    val messages: List<AiTestChatMessage> = emptyList(),
)

data class AiTestChatMessage(

    @field:NotNull(message = "역할이 올바르지 않습니다.")
    val role: AiTestChatRole? = null,

    @field:NotBlank(message = "내용이 올바르지 않습니다.")
    @field:Size(max = ChatMessage.CONTENT_MAX_LENGTH, message = "내용이 너무 깁니다.")
    val content: String,
)

enum class AiTestChatRole {

    USER,
    AI,
}
