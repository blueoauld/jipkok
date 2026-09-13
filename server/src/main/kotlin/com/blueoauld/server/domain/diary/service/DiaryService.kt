package com.blueoauld.server.domain.diary.service

import com.blueoauld.server.domain.diary.dto.request.DiaryAttachmentRequest
import com.blueoauld.server.domain.diary.dto.request.WriteDiaryRequest
import com.blueoauld.server.domain.diary.dto.response.DiaryAttachmentResponse
import com.blueoauld.server.domain.diary.dto.response.DiaryResponse
import com.blueoauld.server.domain.diary.entity.Diary
import com.blueoauld.server.domain.diary.entity.DiaryAttachment
import com.blueoauld.server.domain.diary.entity.type.DiaryAttachmentType
import com.blueoauld.server.domain.diary.repository.DiaryAttachmentRepository
import com.blueoauld.server.domain.diary.repository.DiaryRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.domain.photo.service.PhotoUploadService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.repository.MIN_KEYWORD_LENGTH
import com.blueoauld.server.global.repository.escapeLike
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.storage.dto.StoredObject
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.time.koreaDate
import com.blueoauld.server.global.time.today
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.LocalDate
import java.time.YearMonth

@Service
class DiaryService(

    private val diaryRepository: DiaryRepository,
    private val diaryAttachmentRepository: DiaryAttachmentRepository,
    private val memberRepository: MemberRepository,
    private val photoUploadService: PhotoUploadService,
    private val photoStorage: PhotoStorage,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findMonth(memberId: Long, month: YearMonth): List<DiaryResponse> {
        val diaries = diaryRepository.findAllByMemberIdAndEntryDateBetweenOrderByEntryDate(
            memberId,
            month.atDay(1),
            month.atEndOfMonth(),
        )

        return toResponses(diaries)
    }

    private fun toResponses(
        diaries: List<Diary>,
        signUrl: (String) -> String = photoStorage::createSignedViewUrl,
    ): List<DiaryResponse> {
        if (diaries.isEmpty()) {
            return emptyList()
        }

        val attachments = diaryAttachmentRepository
            .findAllByDiaryIdInOrderByPosition(diaries.map { it.id })
            .groupBy { it.diaryId }

        return diaries.map { toResponse(it, attachments[it.id].orEmpty(), signUrl) }
    }

    @Transactional(readOnly = true)
    fun search(memberId: Long, keyword: String, cursor: Long?, size: Int): CursorResponse<DiaryResponse> {
        val trimmed = keyword.trim()

        if (trimmed.length < MIN_KEYWORD_LENGTH) {
            return CursorResponse(emptyList(), null)
        }

        val pageSize = CursorResponse.pageSize(size)
        val diaries = diaryRepository.search(
            memberId,
            "%${trimmed.escapeLike()}%",
            cursor?.let(LocalDate::ofEpochDay),
            pageSize,
        )

        return CursorResponse(
            items = toResponses(diaries),
            nextCursor = diaries.lastOrNull()?.entryDate?.toEpochDay().takeIf { diaries.size == pageSize },
        )
    }

    @Transactional(readOnly = true)
    fun export(memberId: Long): List<DiaryResponse> =
        toResponses(diaryRepository.findAllByMemberIdOrderByEntryDate(memberId)) {
            photoStorage.createSignedViewUrl(it, EXPORT_URL_VALIDITY)
        }

    fun createUploadUrl(memberId: Long, contentType: String): PhotoUploadUrlResponse =
        photoUploadService.createMediaUploadUrl(memberId, keyPrefix(memberId), contentType)

    @Transactional
    fun write(memberId: Long, entryDate: LocalDate, request: WriteDiaryRequest) {
        if (entryDate.isAfter(clock.today())) {
            throw BusinessException(ErrorCode.FUTURE_DIARY_DATE)
        }

        if (entryDate.isBefore(memberRepository.getMember(memberId).createdAt.koreaDate())) {
            throw BusinessException(ErrorCode.BEFORE_SIGNUP_DIARY_DATE)
        }

        val content = request.content?.trim()?.ifEmpty { null }

        if (content == null && request.attachments.isEmpty()) {
            throw BusinessException(ErrorCode.EMPTY_DIARY)
        }

        val diary = diaryRepository.findByMemberIdAndEntryDate(memberId, entryDate)
            ?.also {
                it.content = content
                it.mood = request.mood
            }
            ?: diaryRepository.saveAndFlush(Diary(memberId, entryDate, content, request.mood))

        syncAttachments(memberId, diary, request.attachments)
    }

    @Transactional
    fun delete(memberId: Long, entryDate: LocalDate) {
        val diary = diaryRepository.findByMemberIdAndEntryDate(memberId, entryDate)
            ?: throw BusinessException(ErrorCode.DIARY_NOT_FOUND)
        val attachments = diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(diary.id)

        diaryAttachmentRepository.deleteAll(attachments)
        diaryRepository.delete(diary)
        publishDeleted(attachments.flatMap { it.objectKeys() })
    }

    @Transactional
    fun deleteAll(memberId: Long) {
        val objectKeys = diaryAttachmentRepository.findObjectKeysByMemberId(memberId)

        diaryAttachmentRepository.deleteAllByMemberId(memberId)
        diaryRepository.deleteAllByMemberId(memberId)
        publishDeleted(objectKeys)
    }

    private fun syncAttachments(memberId: Long, diary: Diary, requested: List<DiaryAttachmentRequest>) {
        val allRequestedKeys = requested.flatMap { listOfNotNull(it.objectKey, it.thumbnailObjectKey) }

        if (allRequestedKeys.toSet().size != allRequestedKeys.size) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }

        val requestedKeys = requested.map { it.objectKey }
        val existing = diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(diary.id).associateBy { it.objectKey }
        val removed = existing.values.filter { it.objectKey !in requestedKeys }
        val added = requested.filter { it.objectKey !in existing }
        val addedKeys = added.flatMap { listOfNotNull(it.objectKey, it.thumbnailObjectKey) }
        val prefix = keyPrefix(memberId)

        if (addedKeys.any { !it.startsWith(prefix) }) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }

        val stored = photoUploadService.confirm(addedKeys)

        diaryAttachmentRepository.deleteAll(removed)
        requested.forEachIndexed { index, request ->
            val kept = existing[request.objectKey]

            if (kept == null) {
                diaryAttachmentRepository.save(newAttachment(diary.id, request, index, stored))
            } else {
                kept.position = index
            }
        }
        publishDeleted(removed.flatMap { it.objectKeys() })
    }

    private fun newAttachment(
        diaryId: Long,
        request: DiaryAttachmentRequest,
        position: Int,
        stored: Map<String, StoredObject>,
    ): DiaryAttachment {
        val media = stored[request.objectKey] ?: throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)

        if (media.contentType?.startsWith(VIDEO_CONTENT_TYPE_PREFIX) != true) {
            if (request.thumbnailObjectKey != null) {
                throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
            }

            return DiaryAttachment(diaryId, DiaryAttachmentType.PHOTO, request.objectKey, position = position)
        }

        val thumbnailKey = request.thumbnailObjectKey ?: throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        val thumbnail = stored[thumbnailKey] ?: throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)

        if (thumbnail.contentType?.startsWith(IMAGE_CONTENT_TYPE_PREFIX) != true) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }

        val durationSeconds = request.durationSeconds

        if (durationSeconds == null || durationSeconds <= 0) {
            throw BusinessException(ErrorCode.INVALID_REQUEST)
        }

        if (durationSeconds > DiaryAttachment.VIDEO_MAX_SECONDS) {
            throw BusinessException(ErrorCode.VIDEO_TOO_LONG)
        }

        return DiaryAttachment(
            diaryId = diaryId,
            type = DiaryAttachmentType.VIDEO,
            objectKey = request.objectKey,
            thumbnailObjectKey = thumbnailKey,
            durationSeconds = durationSeconds,
            position = position,
        )
    }

    private fun publishDeleted(objectKeys: List<String>) {
        if (objectKeys.isNotEmpty()) {
            eventPublisher.publishEvent(PhotosDeletedEvent(objectKeys))
        }
    }

    private fun toResponse(
        diary: Diary,
        attachments: List<DiaryAttachment>,
        signUrl: (String) -> String,
    ) = DiaryResponse(
        entryDate = diary.entryDate,
        content = diary.content,
        mood = diary.mood,
        attachments = attachments.map {
            DiaryAttachmentResponse(
                type = it.type,
                objectKey = it.objectKey,
                url = signUrl(it.objectKey),
                thumbnailUrl = it.thumbnailObjectKey?.let(signUrl),
                durationSeconds = it.durationSeconds,
            )
        },
        updatedAt = diary.updatedAt,
    )

    private fun keyPrefix(memberId: Long) = "$KEY_ROOT/$memberId/"

    companion object {

        val EXPORT_URL_VALIDITY: Duration = Duration.ofHours(1)

        private const val KEY_ROOT = "diaries"
        private const val VIDEO_CONTENT_TYPE_PREFIX = "video/"
        private const val IMAGE_CONTENT_TYPE_PREFIX = "image/"
    }
}
