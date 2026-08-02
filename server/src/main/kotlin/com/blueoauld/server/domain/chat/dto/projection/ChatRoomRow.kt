package com.blueoauld.server.domain.chat.dto.projection

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import java.time.Instant

interface ChatRoomRow {

    fun getRoomId(): Long

    fun getPartnerId(): Long

    fun getUnreadCount(): Int

    fun getLastMessageId(): Long

    fun getLastMessageType(): ChatMessageType

    fun getLastMessageContent(): String?

    fun getLastMessageAt(): Instant
}
