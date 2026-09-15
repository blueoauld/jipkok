package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.domain.ai.dto.projection.AiGreetingCandidateRow
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.domain.ai.entity.type.AiGreetingState
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface AiGreetingJobRepository : JpaRepository<AiGreetingJob, Long> {

    fun findAllByStateAndDueAtLessThanEqualOrderByDueAt(
        state: AiGreetingState,
        threshold: Instant,
        limit: Limit,
    ): List<AiGreetingJob>

    fun countByStateAndSentAtGreaterThanEqual(state: AiGreetingState, start: Instant): Long

    @Query(
        value = """
        select m.id
        from member m
        where m.role = 'MEMBER'
          and m.gender = :gender
          and m.deleted_at is null
          and m.note_receive_enabled
          and m.created_at between :oldest and :threshold
          and not exists (select 1 from ai_greeting_job g where g.member_id = m.id)
        order by m.created_at
        limit :size
        """,
        nativeQuery = true,
    )
    fun findCandidates(
        @Param("gender") gender: String,
        @Param("oldest") oldest: Instant,
        @Param("threshold") threshold: Instant,
        @Param("size") size: Int,
    ): List<Long>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = """
        insert into ai_greeting_job (member_id, state, due_at, attempts, created_at, updated_at)
        values (:memberId, 'PENDING', :dueAt, 0, :now, :now)
        on conflict (member_id) do nothing
        """,
        nativeQuery = true,
    )
    fun insertIfAbsent(@Param("memberId") memberId: Long, @Param("dueAt") dueAt: Instant, @Param("now") now: Instant)

    @Query(
        value = """
        select p.member_id as aiMemberId,
               st_distancesphere(
                 st_makepoint(a.grid_longitude, a.grid_latitude),
                 st_makepoint(cast(:longitude as double precision), cast(:latitude as double precision))
               ) as distanceMeters
        from ai_persona p
        join member a on a.id = p.member_id
        where p.enabled
          and p.greeting_enabled
          and a.deleted_at is null
          and a.gender = :gender
          and a.grid_latitude is not null
          and not exists (
            select 1 from chat_room r
            where r.low_member_id = least(a.id, cast(:memberId as bigint))
              and r.high_member_id = greatest(a.id, cast(:memberId as bigint))
          )
          and not exists (
            select 1 from member_block b
            where (b.blocker_id = a.id and b.blocked_member_id = :memberId)
               or (b.blocker_id = :memberId and b.blocked_member_id = a.id)
          )
          and (
            select count(*) from ai_greeting_job g
            where g.ai_member_id = p.member_id and g.state = 'SENT' and g.sent_at >= :dayStart
          ) < p.daily_greeting_limit
        order by geography(st_makepoint(a.grid_longitude, a.grid_latitude))
          <-> geography(st_makepoint(cast(:longitude as double precision), cast(:latitude as double precision)))
        limit :size
        """,
        nativeQuery = true,
    )
    fun findAiCandidates(
        @Param("memberId") memberId: Long,
        @Param("gender") gender: String,
        @Param("latitude") latitude: Double,
        @Param("longitude") longitude: Double,
        @Param("dayStart") dayStart: Instant,
        @Param("size") size: Int,
    ): List<AiGreetingCandidateRow>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from AiGreetingJob g where g.memberId = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
