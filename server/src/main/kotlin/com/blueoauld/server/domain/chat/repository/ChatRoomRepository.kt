package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.dto.projection.ChatRoomRow
import com.blueoauld.server.domain.chat.entity.ChatRoom
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface ChatRoomRepository : JpaRepository<ChatRoom, Long> {

    fun findByLowMemberIdAndHighMemberId(lowMemberId: Long, highMemberId: Long): ChatRoom?

    fun findByMembers(memberId: Long, partnerId: Long): ChatRoom? =
        findByLowMemberIdAndHighMemberId(minOf(memberId, partnerId), maxOf(memberId, partnerId))

    @Query(
        """
        select r.id as roomId,
               (case when r.lowMemberId = :memberId then r.highMemberId else r.lowMemberId end) as partnerId,
               crm.unreadCount as unreadCount,
               r.lastMessageId as lastMessageId,
               m.type as lastMessageType,
               m.content as lastMessageContent,
               m.createdAt as lastMessageAt
        from ChatRoomMember crm, ChatRoom r, ChatMessage m
        where crm.memberId = :memberId
          and r.id = :roomId
          and r.id = crm.roomId
          and m.id = r.lastMessageId
        """,
    )
    fun findRoom(@Param("memberId") memberId: Long, @Param("roomId") roomId: Long): ChatRoomRow?

    @Query(
        """
        select r.id as roomId,
               (case when r.lowMemberId = :memberId then r.highMemberId else r.lowMemberId end) as partnerId,
               crm.unreadCount as unreadCount,
               r.lastMessageId as lastMessageId,
               m.type as lastMessageType,
               m.content as lastMessageContent,
               m.createdAt as lastMessageAt
        from ChatRoomMember crm, ChatRoom r, ChatMessage m
        where crm.memberId = :memberId
          and r.id = crm.roomId
          and m.id = r.lastMessageId
          and crm.unreadCount >= :minUnreadCount
          and r.lastMessageId < :cursor
        order by r.lastMessageId desc
        """,
    )
    fun findRooms(
        @Param("memberId") memberId: Long,
        @Param("minUnreadCount") minUnreadCount: Int,
        @Param("cursor") cursor: Long,
        limit: Limit,
    ): List<ChatRoomRow>

    @Query(
        """
        select r.id as roomId,
               p.id as partnerId,
               crm.unreadCount as unreadCount,
               r.lastMessageId as lastMessageId,
               m.type as lastMessageType,
               m.content as lastMessageContent,
               m.createdAt as lastMessageAt
        from ChatRoomMember crm, ChatRoom r, ChatMessage m, Member p
        where crm.memberId = :memberId
          and r.id = crm.roomId
          and m.id = r.lastMessageId
          and p.id = (case when r.lowMemberId = :memberId then r.highMemberId else r.lowMemberId end)
          and lower(p.nickname) like lower(:keyword) escape '\'
          and r.lastMessageId < :cursor
        order by r.lastMessageId desc
        """,
    )
    fun searchRooms(
        @Param("memberId") memberId: Long,
        @Param("keyword") keyword: String,
        @Param("cursor") cursor: Long,
        limit: Limit,
    ): List<ChatRoomRow>

    @Query(value = "select id from chat_room where deleted_at < :threshold", nativeQuery = true)
    fun findIdsDeletedBefore(@Param("threshold") threshold: Instant): List<Long>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from chat_room where id in (:roomIds)", nativeQuery = true)
    fun deleteAllByIdIn(@Param("roomIds") roomIds: List<Long>)
}
