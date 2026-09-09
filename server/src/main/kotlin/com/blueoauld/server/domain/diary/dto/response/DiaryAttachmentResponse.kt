package com.blueoauld.server.domain.diary.dto.response

import com.blueoauld.server.domain.diary.entity.type.DiaryAttachmentType

data class DiaryAttachmentResponse(

    val type: DiaryAttachmentType,
    val objectKey: String,
    val url: String,
    val thumbnailUrl: String?,
    val durationSeconds: Int?,
)
