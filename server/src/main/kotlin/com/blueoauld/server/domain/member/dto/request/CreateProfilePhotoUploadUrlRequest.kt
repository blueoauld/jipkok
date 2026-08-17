package com.blueoauld.server.domain.member.dto.request

import com.blueoauld.server.domain.member.entity.type.PhotoVisibility

data class CreateProfilePhotoUploadUrlRequest(

    val contentType: String,
    val visibility: PhotoVisibility,
)
