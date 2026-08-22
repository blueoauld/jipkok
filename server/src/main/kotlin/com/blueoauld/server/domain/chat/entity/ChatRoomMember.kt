package com.blueoauld.server.domain.chat.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

@Entity
@Table(
    name = "chat_room_member",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_chat_room_member_room_id_member_id",
            columnNames = ["room_id", "member_id"],
        ),
    ],
    indexes = [
        Index(name = "idx_chat_room_member_member_id", columnList = "member_id"),
        Index(
            name = "idx_chat_room_member_member_id_last_message_id",
            columnList = "member_id, last_message_id desc",
        ),
    ],
)
class ChatRoomMember(

    @Column(name = "room_id", nullable = false, updatable = false)
    val roomId: Long,

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "last_message_id", nullable = false)
    var lastMessageId: Long = 0,

    @Column(name = "last_read_message_id", nullable = false)
    var lastReadMessageId: Long = 0,

    @Column(name = "unread_count", nullable = false)
    var unreadCount: Int = 0,

    @Column(name = "notification_enabled", nullable = false)
    var notificationEnabled: Boolean = true,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
