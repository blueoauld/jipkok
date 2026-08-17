package com.blueoauld.server.domain.chat.event

import com.blueoauld.server.domain.chat.dto.response.ChatReactionsResponse

data class ChatReactionChangedEvent(

    val receiverId: Long,
    val roomId: Long,
    val reactions: ChatReactionsResponse,
)
