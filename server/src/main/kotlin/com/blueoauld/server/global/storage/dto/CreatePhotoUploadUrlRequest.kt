package com.blueoauld.server.global.storage.dto

import jakarta.validation.constraints.NotBlank

data class CreatePhotoUploadUrlRequest(

    @field:NotBlank(message = "파일 형식이 올바르지 않습니다.")
    val contentType: String,
)
