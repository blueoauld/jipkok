package com.blueoauld.server.domain.admin.dto.projection

interface AiReplyStatRow {

    val aiMemberId: Long
    val replyCount: Long
    val tokenCount: Long
    val cachedTokenCount: Long
}
