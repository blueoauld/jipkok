package com.blueoauld.server.domain.chat.dto.response

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import java.time.Instant

data class ChatMessageResponse(

    val messageId: Long,
    val roomId: Long,
    val senderId: Long,
    val type: ChatMessageType,
    val content: String?,
    val imageUrl: String?,
    val createdAt: Instant,
    val replyMessage: ReplyMessageResponse? = null,
    val clientMessageId: String? = null,
    val reactions: List<ChatReactionResponse> = emptyList(),
) {

    data class ReplyMessageResponse(

        val messageId: Long,
        val senderId: Long,
        val content: String?,
    ) {

        companion object {

            fun from(message: ChatMessage) = ReplyMessageResponse(
                messageId = message.id,
                senderId = message.senderId,
                content = message.content,
            )
        }
    }

    companion object {

        fun of(
            message: ChatMessage,
            imageUrl: String?,
            replyMessage: ReplyMessageResponse? = null,
            reactions: List<ChatReactionResponse> = emptyList(),
        ) = ChatMessageResponse(
            messageId = message.id,
            roomId = message.roomId,
            senderId = message.senderId,
            type = message.type,
            content = message.content,
            imageUrl = imageUrl,
            createdAt = message.createdAt,
            replyMessage = replyMessage,
            clientMessageId = message.clientMessageId,
            reactions = reactions,
        )
    }
}
