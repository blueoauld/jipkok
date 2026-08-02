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
) {

    companion object {

        fun of(message: ChatMessage, imageUrl: String?) = ChatMessageResponse(
            messageId = message.id,
            roomId = message.roomId,
            senderId = message.senderId,
            type = message.type,
            content = message.content,
            imageUrl = imageUrl,
            createdAt = message.createdAt,
        )
    }
}
