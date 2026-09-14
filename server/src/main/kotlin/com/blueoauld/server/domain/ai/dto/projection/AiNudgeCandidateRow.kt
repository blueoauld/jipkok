package com.blueoauld.server.domain.ai.dto.projection

interface AiNudgeCandidateRow {

    val roomId: Long
    val aiMemberId: Long
    val lastMessageId: Long
}
