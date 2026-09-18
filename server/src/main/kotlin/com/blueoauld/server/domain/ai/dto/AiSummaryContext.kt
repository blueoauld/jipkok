package com.blueoauld.server.domain.ai.dto

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.MemberLocale

data class AiSummaryContext(

    val ai: Member,
    val partner: Member,
    val previousSummary: String?,
    val messages: List<ChatMessage>,
    val language: MemberLocale,
)
