package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatRoom
import org.springframework.data.jpa.repository.JpaRepository

interface ChatRoomRepository : JpaRepository<ChatRoom, Long> {

    fun findByLowMemberIdAndHighMemberId(lowMemberId: Long, highMemberId: Long): ChatRoom?
}
