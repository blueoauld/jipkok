package com.blueoauld.server.domain.chat.dto.response

import com.blueoauld.server.domain.chat.entity.ChatMessageReaction
import com.blueoauld.server.domain.chat.entity.type.ChatReactionType

data class ChatReactionResponse(

    val memberId: Long,
    val type: ChatReactionType,
) {

    companion object {

        fun from(reaction: ChatMessageReaction) = ChatReactionResponse(
            memberId = reaction.memberId,
            type = reaction.type,
        )
    }
}
