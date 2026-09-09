package com.blueoauld.server.domain.diary.dto.request

import com.blueoauld.server.domain.diary.entity.DiaryAttachment
import jakarta.validation.Valid
import jakarta.validation.constraints.Size

data class WriteDiaryRequest(

    val content: String? = null,

    @field:Valid
    @field:Size(max = DiaryAttachment.MAX_PER_DIARY, message = "사진과 동영상은 10개까지 넣을 수 있습니다.")
    val attachments: List<DiaryAttachmentRequest> = emptyList(),
)
