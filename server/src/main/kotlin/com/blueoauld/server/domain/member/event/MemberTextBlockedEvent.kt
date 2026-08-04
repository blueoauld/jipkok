package com.blueoauld.server.domain.member.event

import com.blueoauld.server.domain.member.entity.type.ModerationCategory

data class MemberTextBlockedEvent(

    val memberId: Long,
    val nickname: String,
    val field: String,
    val text: String,
    val category: ModerationCategory,
)
