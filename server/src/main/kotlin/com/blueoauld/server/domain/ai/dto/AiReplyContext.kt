package com.blueoauld.server.domain.ai.dto

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import java.time.Instant

data class AiReplyContext(

    val ai: Member,
    val systemPrompt: String,
    val partner: Member,
    val messages: List<ChatMessage>,
    val language: MemberLocale,
    val now: Instant,
    val silentDays: Long? = null,
    val memory: String? = null,
) {

    val lastMessageId: Long
        get() = messages.last().id

    companion object {

        const val MAX_MESSAGES = 30
    }
}
