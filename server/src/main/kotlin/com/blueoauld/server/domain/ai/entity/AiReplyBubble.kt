package com.blueoauld.server.domain.ai.entity

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(
    name = "ai_reply_bubble",
    indexes = [Index(name = "idx_ai_reply_bubble_due_at", columnList = "due_at")],
)
class AiReplyBubble(

    @Column(name = "room_id", nullable = false, updatable = false)
    val roomId: Long,

    @Column(name = "ai_member_id", nullable = false, updatable = false)
    val aiMemberId: Long,

    @Column(name = "content", nullable = false, updatable = false, length = ChatMessage.CONTENT_MAX_LENGTH)
    val content: String,

    @Column(name = "due_at", nullable = false, updatable = false)
    val dueAt: Instant,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
