package com.blueoauld.server.domain.admin.dto.projection

interface AiGreetingStatRow {

    val aiMemberId: Long
    val greetingCount: Long
    val greetingReplyCount: Long
}
