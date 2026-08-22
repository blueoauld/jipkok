package com.blueoauld.server.domain.worry.dto.request

import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class CreateWorryPostRequest(

    @field:NotNull(message = "분류를 선택해주시길 바랍니다.")
    val category: WorryCategory,

    @field:NotBlank(message = "내용을 입력해주시길 바랍니다.")
    @field:Size(max = WorryPost.CONTENT_MAX_LENGTH, message = "내용이 너무 깁니다.")
    val content: String,
)
