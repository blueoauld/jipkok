package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.domain.ai.dto.projection.AiNudgeCandidateRow
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
        insert into ai_reply_job (room_id, ai_member_id, last_message_id, due_at, attempts, kind, created_at, updated_at)
        values (:roomId, :aiMemberId, :lastMessageId, :dueAt, 0, 'REPLY', :now, :now)
        on conflict (room_id) do update
        set last_message_id = excluded.last_message_id,
            due_at = excluded.due_at,
            attempts = 0,
            kind = excluded.kind,
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
    @Query(
        value = """
        insert into ai_reply_job (room_id, ai_member_id, last_message_id, due_at, attempts, kind, created_at, updated_at)
        values (:roomId, :aiMemberId, :lastMessageId, :dueAt, 0, 'NUDGE', :now, :now)
        on conflict (room_id) do nothing
        """,
        nativeQuery = true,
    )
    fun insertNudgeIfAbsent(
        @Param("roomId") roomId: Long,
        @Param("aiMemberId") aiMemberId: Long,
        @Param("lastMessageId") lastMessageId: Long,
        @Param("dueAt") dueAt: Instant,
        @Param("now") now: Instant,
    )

    @Query(
        value = """
        select r.id as roomId,
               p.member_id as aiMemberId,
               m.id as lastMessageId
        from chat_room r
        join ai_persona p on p.member_id in (r.low_member_id, r.high_member_id) and p.enabled
        join chat_message m on m.id = r.last_message_id
        join member u on u.id = case when r.low_member_id = p.member_id then r.high_member_id else r.low_member_id end
        where r.deleted_at is null
          and u.deleted_at is null
          and u.role <> 'AI'
          and m.sender_id = p.member_id
          and m.created_at between :oldest and :threshold
          and exists (select 1 from chat_message um where um.room_id = r.id and um.sender_id = u.id)
          and not exists (select 1 from ai_reply_job j where j.room_id = r.id)
          and not exists (
            select 1 from ai_reply_log l
            where l.room_id = r.id
              and l.kind = 'NUDGE'
              and l.message_id >
                (select max(pm.id) from chat_message pm where pm.room_id = r.id and pm.sender_id = u.id)
          )
        order by m.created_at
        limit :size
        """,
        nativeQuery = true,
    )
    fun findNudgeCandidates(
        @Param("oldest") oldest: Instant,
        @Param("threshold") threshold: Instant,
        @Param("size") size: Int,
    ): List<AiNudgeCandidateRow>

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
