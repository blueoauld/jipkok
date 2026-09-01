package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ChatRoomMemberRepository : JpaRepository<ChatRoomMember, Long> {

    fun findByRoomIdAndMemberId(roomId: Long, memberId: Long): ChatRoomMember?

    fun countByMemberIdAndPinnedTrue(memberId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update ChatRoomMember m
        set m.lastMessageId = :lastMessageId,
            m.unreadCount = case when m.memberId = :partnerId then m.unreadCount + 1 else m.unreadCount end
        where m.roomId = :roomId
        """,
    )
    fun applyLastMessage(
        @Param("roomId") roomId: Long,
        @Param("lastMessageId") lastMessageId: Long,
        @Param("partnerId") partnerId: Long,
    )

    @Query(
        """
        select coalesce(sum(crm.unreadCount), 0)
        from ChatRoomMember crm, ChatRoom r, Member p
        where crm.memberId = :memberId
          and r.id = crm.roomId
          and p.id = (case when r.lowMemberId = :memberId then r.highMemberId else r.lowMemberId end)
        """,
    )
    fun sumUnreadCount(@Param("memberId") memberId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update ChatRoomMember m
        set m.lastReadMessageId = :lastReadMessageId,
            m.unreadCount = (
              select cast(count(msg.id) as Integer)
              from ChatMessage msg
              where msg.roomId = :roomId
                and msg.id > :lastReadMessageId
                and msg.senderId <> :memberId
            )
        where m.roomId = :roomId
          and m.memberId = :memberId
          and m.lastReadMessageId < :lastReadMessageId
        """,
    )
    fun markRead(
        @Param("roomId") roomId: Long,
        @Param("memberId") memberId: Long,
        @Param("lastReadMessageId") lastReadMessageId: Long,
    )

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update ChatRoomMember m
        set m.lastReadMessageId = (select r.lastMessageId from ChatRoom r where r.id = m.roomId),
            m.unreadCount = 0
        where m.memberId = :memberId
          and m.roomId in :roomIds
          and m.lastReadMessageId < (select r.lastMessageId from ChatRoom r where r.id = m.roomId)
        """,
    )
    fun markAllRead(@Param("memberId") memberId: Long, @Param("roomIds") roomIds: List<Long>)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ChatRoomMember m where m.roomId in :roomIds")
    fun deleteByRoomIdIn(@Param("roomIds") roomIds: List<Long>)
}
