package com.blueoauld.server.domain.memo.dto.request

import com.blueoauld.server.domain.memo.entity.MemberMemo
import jakarta.validation.constraints.Size

data class UpdateMemoRequest(

    @field:Size(max = MemberMemo.CONTENT_MAX_LENGTH, message = "메모가 너무 깁니다.")
    val content: String? = null,
)
