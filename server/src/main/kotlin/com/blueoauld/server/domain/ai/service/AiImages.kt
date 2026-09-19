package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType

fun imageMessageOf(context: AiReplyContext): ChatMessage? =
    context.messages
        .takeLastWhile { it.senderId != context.ai.id }
        .lastOrNull { imageObjectKeyOf(it) != null }

fun imageObjectKeyOf(message: ChatMessage): String? = when (message.type) {
    ChatMessageType.TEXT -> null
    ChatMessageType.PHOTO -> message.objectKey
    ChatMessageType.VIDEO -> message.thumbnailObjectKey
}
