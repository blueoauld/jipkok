package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.dto.projection.AiGreetingStatRow
import com.blueoauld.server.domain.admin.dto.projection.AiGreetingTotalRow
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface AiGreetingJobAdminRepository : JpaRepository<AiGreetingJob, Long> {

    @Query(
        value = """
        select g.ai_member_id as aiMemberId,
               count(*) as greetingCount,
               count(*) filter (where $REPLIED) as greetingReplyCount
        from ai_greeting_job g
        where g.state = 'SENT'
          and g.ai_member_id in (:aiMemberIds)
          and g.sent_at >= :start
        group by g.ai_member_id
        """,
        nativeQuery = true,
    )
    fun sumByAiMemberIdSince(
        @Param("aiMemberIds") aiMemberIds: Collection<Long>,
        @Param("start") start: Instant,
    ): List<AiGreetingStatRow>

    @Query(
        value = """
        select count(*) as greetingCount,
               count(*) filter (where $REPLIED) as greetingReplyCount
        from ai_greeting_job g
        where g.state = 'SENT'
          and g.sent_at >= :start
        """,
        nativeQuery = true,
    )
    fun sumAllSince(@Param("start") start: Instant): AiGreetingTotalRow

    companion object {

        private const val REPLIED =
            "exists (select 1 from chat_message m where m.room_id = g.room_id and m.sender_id = g.member_id)"
    }
}
