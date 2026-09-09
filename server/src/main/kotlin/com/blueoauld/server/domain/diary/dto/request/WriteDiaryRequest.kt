package com.blueoauld.server.domain.diary.dto.request

import jakarta.validation.constraints.NotBlank

data class WriteDiaryRequest(

    @field:NotBlank(message = "내용을 입력해주시길 바랍니다.")
    val content: String,
)
