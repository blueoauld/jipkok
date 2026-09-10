package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.diary.entity.type.DiaryAttachmentType
import com.blueoauld.server.domain.diary.entity.type.DiaryMood
import java.time.Instant
import java.time.LocalDate

data class AdminDiaryPageResponse(

    val items: List<AdminDiarySummaryResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminDiarySummaryResponse(

    val id: Long,
    val member: AdminChatMemberResponse,
    val entryDate: LocalDate,
    val mood: DiaryMood?,
    val contentPreview: String?,
    val attachmentCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class AdminDiaryDetailResponse(

    val id: Long,
    val member: AdminChatMemberResponse,
    val entryDate: LocalDate,
    val mood: DiaryMood?,
    val content: String?,
    val attachments: List<AdminDiaryAttachmentResponse>,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class AdminDiaryAttachmentResponse(

    val type: DiaryAttachmentType,
    val url: String,
    val thumbnailUrl: String?,
    val durationSeconds: Int?,
)
