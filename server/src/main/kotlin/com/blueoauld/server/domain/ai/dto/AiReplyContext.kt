package com.blueoauld.server.domain.ai.dto

import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.member.entity.Member
import java.time.Instant

data class AiReplyContext(

    val ai: Member,
    val persona: AiPersona,
    val partner: Member,
    val messages: List<ChatMessage>,
    val now: Instant,
) {

    val lastMessageId: Long
        get() = messages.last().id
}
