package com.blueoauld.server.domain.chat.dto.request

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import jakarta.validation.constraints.Size

data class SendMessageRequest(

    val type: ChatMessageType,

    @field:Size(max = ChatMessage.CONTENT_MAX_LENGTH, message = "내용이 너무 깁니다.")
    val content: String? = null,

    val objectKey: String? = null,

    val replyToMessageId: Long? = null,

    @field:Size(max = ChatMessage.CLIENT_MESSAGE_ID_MAX_LENGTH, message = "클라이언트 메시지 id가 너무 깁니다.")
    val clientMessageId: String? = null,
)
