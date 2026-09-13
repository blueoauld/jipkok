package com.blueoauld.server.domain.diary.dto.request

import com.blueoauld.server.domain.diary.entity.Diary
import com.blueoauld.server.domain.diary.entity.DiaryAttachment
import com.blueoauld.server.domain.diary.entity.type.DiaryMood
import jakarta.validation.Valid
import jakarta.validation.constraints.Size

data class WriteDiaryRequest(

    @field:Size(max = Diary.CONTENT_MAX_LENGTH, message = "일기는 2만 자까지 쓸 수 있습니다.")
    val content: String? = null,

    val mood: DiaryMood? = null,

    @field:Valid
    @field:Size(max = DiaryAttachment.MAX_PER_DIARY, message = "사진과 동영상은 10개까지 넣을 수 있습니다.")
    val attachments: List<DiaryAttachmentRequest> = emptyList(),
)
