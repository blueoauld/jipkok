package com.blueoauld.server.domain.chat.dto.request

import com.blueoauld.server.domain.chat.entity.type.ChatReactionType

data class ReactMessageRequest(

    val type: ChatReactionType,
)
