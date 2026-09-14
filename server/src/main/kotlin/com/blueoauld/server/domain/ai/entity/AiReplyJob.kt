package com.blueoauld.server.domain.ai.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Duration
import java.time.Instant

@Entity
@Table(
    name = "ai_reply_job",
    indexes = [Index(name = "idx_ai_reply_job_due_at", columnList = "due_at")],
)
class AiReplyJob(

    @Id
    @Column(name = "room_id")
    val roomId: Long,

    @Column(name = "ai_member_id", nullable = false)
    val aiMemberId: Long,

    @Column(name = "last_message_id", nullable = false)
    val lastMessageId: Long,

    @Column(name = "due_at", nullable = false)
    val dueAt: Instant,

    @Column(name = "attempts", nullable = false)
    val attempts: Int = 0,
) : BaseEntity() {

    fun hasAttemptsLeft() = attempts + 1 < MAX_ATTEMPTS

    companion object {

        const val MAX_ATTEMPTS = 3

        val RETRY_DELAY: Duration = Duration.ofMinutes(5)
    }
}
