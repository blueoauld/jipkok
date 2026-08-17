package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatMessageReaction
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ChatMessageReactionRepository : JpaRepository<ChatMessageReaction, Long> {

    fun findByMessageId(messageId: Long): List<ChatMessageReaction>

    fun findByMessageIdIn(messageIds: Collection<Long>): List<ChatMessageReaction>

    fun findByMessageIdAndMemberId(messageId: Long, memberId: Long): ChatMessageReaction?

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ChatMessageReaction r where r.roomId in :roomIds")
    fun deleteByRoomIdIn(@Param("roomIds") roomIds: List<Long>)
}
