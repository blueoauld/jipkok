package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminChatMemberResponse
import com.blueoauld.server.domain.admin.dto.response.AdminDiaryAttachmentResponse
import com.blueoauld.server.domain.admin.dto.response.AdminDiaryDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminDiaryPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminDiarySummaryResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.DiaryAdminRepository
import com.blueoauld.server.domain.diary.repository.DiaryAttachmentRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminDiaryService(

    private val diaryAdminRepository: DiaryAdminRepository,
    private val diaryAttachmentRepository: DiaryAttachmentRepository,
    private val memberAdminService: MemberAdminService,
    private val photoStorage: PhotoStorage,
    private val adminActionRecorder: AdminActionRecorder,
) {

    @Transactional(readOnly = true)
    fun findDiaries(memberId: Long?, page: Int, size: Int): AdminDiaryPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)
        val diaries = diaryAdminRepository.findAllForAdmin(memberId, safeSize, AdminPaging.offset(safePage, safeSize))
        val nicknames = memberAdminService.findNicknames(diaries.map { it.memberId })
        val attachmentCounts = diaryAttachmentRepository
            .findAllByDiaryIdInOrderByPosition(diaries.map { it.id })
            .groupingBy { it.diaryId }
            .eachCount()

        return AdminDiaryPageResponse(
            items = diaries.map {
                AdminDiarySummaryResponse(
                    id = it.id,
                    member = AdminChatMemberResponse(it.memberId, nicknames.getValue(it.memberId)),
                    entryDate = it.entryDate,
                    mood = it.mood,
                    contentPreview = it.content?.lineSequence()?.first()?.take(PREVIEW_MAX_LENGTH),
                    attachmentCount = attachmentCounts[it.id] ?: 0,
                    createdAt = it.createdAt,
                    updatedAt = it.updatedAt,
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = diaryAdminRepository.countForAdmin(memberId),
        )
    }

    @Transactional
    fun findDiary(actorId: Long, diaryId: Long): AdminDiaryDetailResponse {
        val diary = diaryAdminRepository.findById(diaryId).orElseThrow {
            BusinessException(ErrorCode.DIARY_NOT_FOUND)
        }
        val nickname = memberAdminService.findNickname(diary.memberId)
        val attachments = diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(diary.id)

        adminActionRecorder.record(actorId, AdminActionType.VIEW_DIARY, diaryId)

        return AdminDiaryDetailResponse(
            id = diary.id,
            member = AdminChatMemberResponse(diary.memberId, nickname),
            entryDate = diary.entryDate,
            mood = diary.mood,
            content = diary.content,
            attachments = attachments.map {
                AdminDiaryAttachmentResponse(
                    type = it.type,
                    url = photoStorage.createSignedViewUrl(it.objectKey),
                    thumbnailUrl = it.thumbnailObjectKey?.let(photoStorage::createSignedViewUrl),
                    durationSeconds = it.durationSeconds,
                )
            },
            createdAt = diary.createdAt,
            updatedAt = diary.updatedAt,
        )
    }

    companion object {

        const val PREVIEW_MAX_LENGTH = 80
    }
}
