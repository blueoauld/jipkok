package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.dto.projection.AiReplyStatRow
import com.blueoauld.server.domain.admin.dto.projection.AiReplyTotalRow
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface AiReplyLogAdminRepository : JpaRepository<AiReplyLog, Long> {

    @Query(
        """
        select l.aiMemberId as aiMemberId,
               count(l) as replyCount,
               coalesce(sum(l.promptTokens + l.completionTokens), 0) as tokenCount
        from AiReplyLog l
        where l.aiMemberId in :aiMemberIds and l.createdAt >= :start
        group by l.aiMemberId
        """,
    )
    fun sumByAiMemberIdSince(
        @Param("aiMemberIds") aiMemberIds: Collection<Long>,
        @Param("start") start: Instant,
    ): List<AiReplyStatRow>

    @Query(
        """
        select count(l) as replyCount,
               coalesce(sum(l.promptTokens + l.completionTokens), 0) as tokenCount
        from AiReplyLog l
        where l.createdAt >= :start
        """,
    )
    fun sumAllSince(@Param("start") start: Instant): AiReplyTotalRow
}
