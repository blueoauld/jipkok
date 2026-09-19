package com.blueoauld.server.domain.ai.entity

import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant

@Entity
@Table(
    name = "ai_reply_log",
    indexes = [
        Index(name = "idx_ai_reply_log_ai_member_id_created_at", columnList = "ai_member_id, created_at"),
        Index(name = "idx_ai_reply_log_room_id_created_at", columnList = "room_id, created_at"),
        Index(name = "idx_ai_reply_log_created_at", columnList = "created_at"),
        Index(name = "idx_ai_reply_log_room_id_kind_message_id", columnList = "room_id, kind, message_id"),
    ],
)
class AiReplyLog(

    @Column(name = "ai_member_id", nullable = false, updatable = false)
    val aiMemberId: Long,

    @Column(name = "room_id", nullable = false, updatable = false)
    val roomId: Long,

    @Column(name = "message_id", nullable = false, updatable = false)
    val messageId: Long,

    @Column(name = "prompt_tokens", nullable = false, updatable = false)
    val promptTokens: Int,

    @Column(name = "completion_tokens", nullable = false, updatable = false)
    val completionTokens: Int,

    @Column(name = "cached_tokens", nullable = false, updatable = false)
    val cachedTokens: Int,

    @Column(name = "model", updatable = false, length = MODEL_MAX_LENGTH)
    val model: String?,

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, updatable = false)
    val kind: AiReplyKind = AiReplyKind.REPLY,

    @Enumerated(EnumType.STRING)
    @Column(name = "language", updatable = false, length = LANGUAGE_MAX_LENGTH)
    val language: MemberLocale? = null,

    // 언어가 어긋나 다시 만든 답이다. 프롬프트나 모델을 손봐야 하는지 보는 근거다.
    @Column(name = "regenerated", nullable = false, updatable = false)
    val regenerated: Boolean = false,

    @Column(name = "away_until", updatable = false)
    val awayUntil: Instant? = null,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.EPOCH
        protected set

    companion object {

        const val MODEL_MAX_LENGTH = 100
        const val LANGUAGE_MAX_LENGTH = 10
    }
}
