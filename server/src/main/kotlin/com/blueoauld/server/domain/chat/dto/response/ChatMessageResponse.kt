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
    val videoUrl: String? = null,
    val thumbnailUrl: String? = null,
    val durationSeconds: Int? = null,
    val createdAt: Instant,
    val replyMessage: ReplyMessageResponse? = null,
    val clientMessageId: String? = null,
    val reactions: List<ChatReactionResponse> = emptyList(),
) {

    data class MediaUrls(

        val imageUrl: String? = null,
        val videoUrl: String? = null,
        val thumbnailUrl: String? = null,
    ) {

        companion object {

            val NONE = MediaUrls()
        }
    }

    data class ReplyMessageResponse(

        val messageId: Long,
        val senderId: Long,
        val type: ChatMessageType,
        val content: String?,
    ) {

        companion object {

            fun from(message: ChatMessage) = ReplyMessageResponse(
                messageId = message.id,
                senderId = message.senderId,
                type = message.type,
                content = message.content,
            )
        }
    }

    companion object {

        fun of(
            message: ChatMessage,
            media: MediaUrls,
            replyMessage: ReplyMessageResponse? = null,
            reactions: List<ChatReactionResponse> = emptyList(),
        ) = ChatMessageResponse(
            messageId = message.id,
            roomId = message.roomId,
            senderId = message.senderId,
            type = message.type,
            content = message.content,
            imageUrl = media.imageUrl,
            videoUrl = media.videoUrl,
            thumbnailUrl = media.thumbnailUrl,
            durationSeconds = message.durationSeconds,
            createdAt = message.createdAt,
            replyMessage = replyMessage,
            clientMessageId = message.clientMessageId,
            reactions = reactions,
        )
    }
}
