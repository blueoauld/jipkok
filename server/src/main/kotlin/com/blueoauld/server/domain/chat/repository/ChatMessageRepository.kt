package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatMessage
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ChatMessageRepository : JpaRepository<ChatMessage, Long> {

    @Query(
        """
        select m.objectKey
        from ChatMessage m
        where m.roomId in :roomIds and m.objectKey is not null
        """,
    )
    fun findObjectKeysByRoomIdIn(@Param("roomIds") roomIds: List<Long>): List<String>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ChatMessage m where m.roomId in :roomIds")
    fun deleteByRoomIdIn(@Param("roomIds") roomIds: List<Long>)
}
