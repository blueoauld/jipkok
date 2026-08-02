package com.blueoauld.server.domain.chat.entity

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.global.entity.BaseEntity
import com.blueoauld.server.global.storage.entity.PhotoUpload
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "chat_message",
    indexes = [Index(name = "idx_chat_message_room_id_id", columnList = "room_id, id")],
)
class ChatMessage(

    @Column(name = "room_id", nullable = false, updatable = false)
    val roomId: Long,

    @Column(name = "sender_id", nullable = false, updatable = false)
    val senderId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, updatable = false)
    val type: ChatMessageType,

    @Column(name = "content", updatable = false, length = CONTENT_MAX_LENGTH)
    val content: String? = null,

    @Column(name = "object_key", updatable = false, length = PhotoUpload.OBJECT_KEY_MAX_LENGTH)
    val objectKey: String? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val CONTENT_MAX_LENGTH = 1000
        const val PHOTO_MAX_COUNT = 6
    }
}
