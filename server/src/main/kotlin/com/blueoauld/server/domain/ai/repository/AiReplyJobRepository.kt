package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.domain.ai.entity.AiReplyJob
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface AiReplyJobRepository : JpaRepository<AiReplyJob, Long> {

    fun findAllByDueAtLessThanEqualOrderByDueAt(threshold: Instant, limit: Limit): List<AiReplyJob>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = """
        insert into ai_reply_job (room_id, ai_member_id, last_message_id, due_at, attempts, created_at, updated_at)
        values (:roomId, :aiMemberId, :lastMessageId, :dueAt, 0, :now, :now)
        on conflict (room_id) do update
        set last_message_id = excluded.last_message_id,
            due_at = excluded.due_at,
            attempts = 0,
            updated_at = excluded.updated_at
        """,
        nativeQuery = true,
    )
    fun upsert(
        @Param("roomId") roomId: Long,
        @Param("aiMemberId") aiMemberId: Long,
        @Param("lastMessageId") lastMessageId: Long,
        @Param("dueAt") dueAt: Instant,
        @Param("now") now: Instant,
    )

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update AiReplyJob j set j.dueAt = :dueAt, j.updatedAt = :now where j.roomId = :roomId")
    fun postpone(@Param("roomId") roomId: Long, @Param("dueAt") dueAt: Instant, @Param("now") now: Instant)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update AiReplyJob j
        set j.dueAt = :dueAt, j.attempts = j.attempts + 1, j.updatedAt = :now
        where j.roomId = :roomId
        """,
    )
    fun retry(@Param("roomId") roomId: Long, @Param("dueAt") dueAt: Instant, @Param("now") now: Instant)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update AiReplyJob j
        set j.dueAt = :dueAt, j.updatedAt = :now
        where j.aiMemberId = :aiMemberId and j.dueAt > :dueAt
        """,
    )
    fun pullForward(@Param("aiMemberId") aiMemberId: Long, @Param("dueAt") dueAt: Instant, @Param("now") now: Instant)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from AiReplyJob j where j.roomId = :roomId and j.lastMessageId = :lastMessageId")
    fun deleteIfUnchanged(@Param("roomId") roomId: Long, @Param("lastMessageId") lastMessageId: Long)
}
