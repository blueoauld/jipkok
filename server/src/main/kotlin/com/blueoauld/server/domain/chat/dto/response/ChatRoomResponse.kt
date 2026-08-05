package com.blueoauld.server.domain.chat.dto.response

import com.blueoauld.server.domain.chat.dto.projection.ChatRoomRow
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import java.time.Instant

data class ChatRoomResponse(

    val roomId: Long,
    val memberId: Long,
    val nickname: String,
    val profileImageUrl: String?,
    val lastMessageType: ChatMessageType,
    val lastMessageContent: String?,
    val lastMessageAt: Instant,
    val unreadCount: Int,
    val notificationEnabled: Boolean,
) {

    companion object {

        fun of(row: ChatRoomRow, partner: MemberSummaryResponse) = ChatRoomResponse(
            roomId = row.getRoomId(),
            memberId = partner.memberId,
            nickname = partner.nickname,
            profileImageUrl = partner.profileImageUrl,
            lastMessageType = row.getLastMessageType(),
            lastMessageContent = row.getLastMessageContent(),
            lastMessageAt = row.getLastMessageAt(),
            unreadCount = row.getUnreadCount(),
            notificationEnabled = row.getNotificationEnabled(),
        )
    }
}
