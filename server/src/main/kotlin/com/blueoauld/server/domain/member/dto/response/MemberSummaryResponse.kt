package com.blueoauld.server.domain.member.dto.response

import com.blueoauld.server.domain.member.entity.type.Gender

data class MemberSummaryResponse(

    val memberId: Long,
    val nickname: String,
    val gender: Gender,
    val age: Int,
    val receivedLikeCount: Int,
    val comment: String?,
    val profileImageUrl: String?,
    val memo: String?,
)
