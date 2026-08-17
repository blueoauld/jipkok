package com.blueoauld.server.domain.chat.entity

import com.blueoauld.server.domain.chat.entity.type.ChatReactionType
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

@Entity
@Table(
    name = "chat_message_reaction",
    indexes = [Index(name = "idx_chat_message_reaction_room_id", columnList = "room_id")],
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_chat_message_reaction_message_id_member_id",
            columnNames = ["message_id", "member_id"],
        ),
    ],
)
class ChatMessageReaction(

    @Column(name = "room_id", nullable = false, updatable = false)
    val roomId: Long,

    @Column(name = "message_id", nullable = false, updatable = false)
    val messageId: Long,

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: ChatReactionType,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
