package com.blueoauld.server.domain.diary.dto.response

import com.blueoauld.server.domain.diary.entity.type.DiaryMood
import java.time.Instant
import java.time.LocalDate

data class DiaryResponse(

    val entryDate: LocalDate,
    val content: String?,
    val mood: DiaryMood?,
    val attachments: List<DiaryAttachmentResponse>,
    val updatedAt: Instant,
)
