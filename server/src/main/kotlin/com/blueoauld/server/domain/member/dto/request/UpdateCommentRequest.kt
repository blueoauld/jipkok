package com.blueoauld.server.domain.member.dto.request

import com.blueoauld.server.domain.member.entity.Member
import jakarta.validation.constraints.Size

data class UpdateCommentRequest(

    @field:Size(max = Member.COMMENT_MAX_LENGTH, message = "코멘트가 너무 깁니다.")
    val comment: String? = null,
)
