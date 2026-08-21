package com.blueoauld.server.domain.worry.dto.request

import com.blueoauld.server.domain.worry.entity.WorryComment
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateWorryCommentRequest(

    @field:NotBlank(message = "내용을 입력해주세요.")
    @field:Size(max = WorryComment.CONTENT_MAX_LENGTH, message = "내용이 너무 깁니다.")
    val content: String,

    val parentId: Long? = null,
)
