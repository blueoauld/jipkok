package com.blueoauld.server.domain.ai.dto

import com.blueoauld.server.domain.member.entity.Member
import java.time.Instant

data class AiGreetingContext(

    val ai: Member,
    val systemPrompt: String,
    val partner: Member,
    val now: Instant,
    val distanceMeters: Double?,
)
