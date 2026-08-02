package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ChatRoomMemberRepository : JpaRepository<ChatRoomMember, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update ChatRoomMember m
        set m.unreadCount = m.unreadCount + 1
        where m.roomId = :roomId and m.memberId = :memberId
        """,
    )
    fun increaseUnreadCount(@Param("roomId") roomId: Long, @Param("memberId") memberId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ChatRoomMember m where m.roomId in :roomIds")
    fun deleteByRoomIdIn(@Param("roomIds") roomIds: List<Long>)
}
