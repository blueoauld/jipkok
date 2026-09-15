package com.blueoauld.server.domain.ai.entity

import com.blueoauld.server.domain.ai.entity.type.AiGreetingState
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate
import java.time.Duration
import java.time.Instant

@DynamicUpdate
@Entity
@Table(name = "ai_greeting_job")
class AiGreetingJob(

    @Id
    @Column(name = "member_id")
    val memberId: Long,

    @Column(name = "due_at", nullable = false)
    var dueAt: Instant,

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    var state: AiGreetingState = AiGreetingState.PENDING,

    @Column(name = "attempts", nullable = false)
    var attempts: Int = 0,

    @Column(name = "ai_member_id")
    var aiMemberId: Long? = null,

    @Column(name = "room_id")
    var roomId: Long? = null,

    @Column(name = "sent_at")
    var sentAt: Instant? = null,

    @Column(name = "dropped_reason", length = DROPPED_REASON_MAX_LENGTH)
    var droppedReason: String? = null,
) : BaseEntity() {

    fun hasAttemptsLeft() = attempts + 1 < MAX_ATTEMPTS

    fun postpone(dueAt: Instant) {
        this.dueAt = dueAt
    }

    fun retry(dueAt: Instant) {
        this.dueAt = dueAt
        attempts += 1
    }

    fun markSent(aiMemberId: Long, roomId: Long, sentAt: Instant) {
        this.aiMemberId = aiMemberId
        this.roomId = roomId
        this.sentAt = sentAt
        state = AiGreetingState.SENT
    }

    fun drop(reason: String) {
        droppedReason = reason.take(DROPPED_REASON_MAX_LENGTH)
        state = AiGreetingState.DROPPED
    }

    companion object {

        const val MAX_ATTEMPTS = 3
        const val DROPPED_REASON_MAX_LENGTH = 100

        val RETRY_DELAY: Duration = Duration.ofMinutes(5)
    }
}
