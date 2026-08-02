package com.blueoauld.server.domain.chat.event

import com.blueoauld.server.domain.chat.dto.response.ChatMessageResponse

data class ChatMessageSentEvent(

    val receiverId: Long,
    val message: ChatMessageResponse,
)
