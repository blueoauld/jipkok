package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatRoom
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface ChatRoomRepository : JpaRepository<ChatRoom, Long> {

    fun findByLowMemberIdAndHighMemberId(lowMemberId: Long, highMemberId: Long): ChatRoom?

    fun findByMembers(memberId: Long, partnerId: Long): ChatRoom? =
        findByLowMemberIdAndHighMemberId(minOf(memberId, partnerId), maxOf(memberId, partnerId))

    @Query(value = "select id from chat_room where deleted_at < :threshold", nativeQuery = true)
    fun findIdsDeletedBefore(@Param("threshold") threshold: Instant): List<Long>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from chat_room where id in (:roomIds)", nativeQuery = true)
    fun deleteAllByIdIn(@Param("roomIds") roomIds: List<Long>)
}
