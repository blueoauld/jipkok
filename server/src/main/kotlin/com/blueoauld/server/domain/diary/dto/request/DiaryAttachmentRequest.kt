package com.blueoauld.server.domain.diary.dto.request

import jakarta.validation.constraints.NotBlank

data class DiaryAttachmentRequest(

    @field:NotBlank(message = "사진 정보가 올바르지 않습니다.")
    val objectKey: String,

    val thumbnailObjectKey: String? = null,

    val durationSeconds: Int? = null,
)
