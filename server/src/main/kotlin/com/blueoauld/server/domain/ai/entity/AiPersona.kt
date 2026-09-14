package com.blueoauld.server.domain.ai.entity

import com.blueoauld.server.global.entity.BaseEntity
import com.blueoauld.server.global.time.KOREA
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.hibernate.annotations.DynamicUpdate
import java.time.Duration
import java.time.Instant
import kotlin.random.Random

@DynamicUpdate
@Entity
@Table(
    name = "ai_persona",
    indexes = [
        Index(
            name = "idx_ai_persona_enabled_next_location_refresh_at",
            columnList = "enabled, next_location_refresh_at",
        ),
    ],
)
class AiPersona(

    @Id
    @Column(name = "member_id")
    val memberId: Long,

    @Column(name = "enabled", nullable = false)
    var enabled: Boolean = true,

    @Column(name = "system_prompt", nullable = false, columnDefinition = "TEXT")
    var systemPrompt: String,

    @Column(name = "reply_delay_min_seconds", nullable = false)
    var replyDelayMinSeconds: Int = DEFAULT_REPLY_DELAY_MIN_SECONDS,

    @Column(name = "reply_delay_max_seconds", nullable = false)
    var replyDelayMaxSeconds: Int = DEFAULT_REPLY_DELAY_MAX_SECONDS,

    @Column(name = "active_start_hour", nullable = false)
    var activeStartHour: Int = DEFAULT_ACTIVE_START_HOUR,

    @Column(name = "active_end_hour", nullable = false)
    var activeEndHour: Int = DEFAULT_ACTIVE_END_HOUR,

    @Column(name = "daily_reply_limit", nullable = false)
    var dailyReplyLimit: Int = DEFAULT_DAILY_REPLY_LIMIT,

    @Column(name = "next_location_refresh_at", nullable = false)
    var nextLocationRefreshAt: Instant,
) : BaseEntity() {

    fun update(
        enabled: Boolean,
        systemPrompt: String,
        replyDelayMinSeconds: Int,
        replyDelayMaxSeconds: Int,
        activeStartHour: Int,
        activeEndHour: Int,
        dailyReplyLimit: Int,
    ) {
        this.enabled = enabled
        this.systemPrompt = systemPrompt
        this.replyDelayMinSeconds = replyDelayMinSeconds
        this.replyDelayMaxSeconds = replyDelayMaxSeconds
        this.activeStartHour = activeStartHour
        this.activeEndHour = activeEndHour
        this.dailyReplyLimit = dailyReplyLimit
    }

    fun randomReplyDelay(): Duration =
        Duration.ofSeconds(Random.nextLong(replyDelayMinSeconds.toLong(), replyDelayMaxSeconds + 1L))

    fun isActiveAt(instant: Instant): Boolean {
        val hour = instant.atZone(KOREA).hour

        return when {
            activeStartHour == activeEndHour -> true
            activeStartHour < activeEndHour -> hour in activeStartHour until activeEndHour
            else -> hour !in activeEndHour..<activeStartHour
        }
    }

    fun nextActiveStart(instant: Instant): Instant {
        val zoned = instant.atZone(KOREA)
        val todayStart = zoned.toLocalDate().atTime(activeStartHour, 0).atZone(KOREA)
        val start = if (todayStart.isAfter(zoned)) todayStart else todayStart.plusDays(1)

        return start.toInstant()
    }

    companion object {

        const val SYSTEM_PROMPT_MAX_LENGTH = 4000
        const val REPLY_DELAY_MAX_SECONDS = 3600
        const val DAILY_REPLY_LIMIT_MAX = 10_000
        const val LAST_HOUR = 23

        const val DEFAULT_REPLY_DELAY_MIN_SECONDS = 10
        const val DEFAULT_REPLY_DELAY_MAX_SECONDS = 180
        const val DEFAULT_ACTIVE_START_HOUR = 8
        const val DEFAULT_ACTIVE_END_HOUR = 1
        const val DEFAULT_DAILY_REPLY_LIMIT = 500

        val LOCATION_REFRESH_MIN_INTERVAL: Duration = Duration.ofMinutes(20)
        val LOCATION_REFRESH_MAX_INTERVAL: Duration = Duration.ofHours(3)
    }
}
