package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface AiReplyLogRepository : JpaRepository<AiReplyLog, Long> {

    fun countByRoomIdAndKindNotAndCreatedAtGreaterThanEqual(roomId: Long, kind: AiReplyKind, start: Instant): Long

    fun countByAiMemberIdAndKindNotAndCreatedAtGreaterThanEqual(
        aiMemberId: Long,
        kind: AiReplyKind,
        start: Instant,
    ): Long

    fun countByKindNotAndCreatedAtGreaterThanEqual(kind: AiReplyKind, start: Instant): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from AiReplyLog l where l.createdAt < :threshold")
    fun deleteAllByCreatedAtBefore(@Param("threshold") threshold: Instant): Int
}
