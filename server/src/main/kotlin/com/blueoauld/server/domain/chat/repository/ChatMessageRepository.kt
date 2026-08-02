package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.domain.chat.entity.ChatMessage
import org.springframework.data.jpa.repository.JpaRepository

interface ChatMessageRepository : JpaRepository<ChatMessage, Long>
