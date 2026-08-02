package com.blueoauld.server.domain.chat.dto.request

import com.blueoauld.server.domain.chat.entity.ChatMessage
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SendNoteRequest(

    @field:NotBlank(message = "내용을 입력해주시길 바랍니다.")
    @field:Size(max = ChatMessage.CONTENT_MAX_LENGTH, message = "내용이 너무 깁니다.")
    val content: String,
)
