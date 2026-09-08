package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import java.time.Instant

data class AdminChatRoomPageResponse(

    val items: List<AdminChatRoomResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminChatRoomResponse(

    val id: Long,
    val low: AdminChatMemberResponse,
    val high: AdminChatMemberResponse,
    val lastMessageType: ChatMessageType?,
    val lastMessageContent: String?,
    val lastMessageAt: Instant?,
    val createdAt: Instant,
    val deletedAt: Instant?,
)

data class AdminChatRoomDetailResponse(

    val id: Long,
    val members: List<AdminChatMemberResponse>,
    val createdAt: Instant,
    val deletedAt: Instant?,
)

data class AdminChatMemberResponse(

    val id: Long,
    val nickname: String,
)

data class AdminChatMessagePageResponse(

    val items: List<AdminChatMessageResponse>,
    val nextCursor: Long?,
)
