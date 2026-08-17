package com.blueoauld.server.domain.chat.dto.response

data class ChatReactionsResponse(

    val messageId: Long,
    val reactions: List<ChatReactionResponse>,
)
