package com.blueoauld.server.domain.photo.dto.request

import jakarta.validation.constraints.NotBlank

data class CreatePhotoUploadUrlRequest(

    @field:NotBlank(message = "파일 형식이 올바르지 않습니다.")
    val contentType: String,
)
