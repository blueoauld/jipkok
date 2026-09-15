package com.blueoauld.server.domain.admin.dto.projection

interface AiReplyTotalRow {

    val replyCount: Long
    val tokenCount: Long
    val cachedTokenCount: Long
}
