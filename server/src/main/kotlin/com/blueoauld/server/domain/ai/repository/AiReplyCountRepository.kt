package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.domain.ai.entity.AiPersona
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface AiReplyCountRepository : JpaRepository<AiPersona, Long> {

    @Query(
        value = """
        select count(*) from chat_message
        where room_id = :roomId and sender_id = :aiMemberId and created_at >= :start
        """,
        nativeQuery = true,
    )
    fun countRoomRepliesSince(
        @Param("roomId") roomId: Long,
        @Param("aiMemberId") aiMemberId: Long,
        @Param("start") start: Instant,
    ): Long

    @Query(
        value = "select count(*) from chat_message where sender_id = :aiMemberId and created_at >= :start",
        nativeQuery = true,
    )
    fun countRepliesSince(@Param("aiMemberId") aiMemberId: Long, @Param("start") start: Instant): Long

    @Query(
        value = """
        select count(*) from chat_message m
        join ai_persona p on p.member_id = m.sender_id
        where m.created_at >= :start
        """,
        nativeQuery = true,
    )
    fun countAllRepliesSince(@Param("start") start: Instant): Long
}
