package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.dto.request.CreateFeedPhotoUploadUrlRequest
import com.blueoauld.server.domain.feed.dto.request.CreateFeedPostRequest
import com.blueoauld.server.domain.feed.dto.response.FeedPhotoUploadUrlResponse
import com.blueoauld.server.domain.feed.dto.response.FeedPostResponse
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.entity.type.FeedSort
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

@Service
class FeedPostService(

    private val feedPostRepository: FeedPostRepository,
    private val photoUploadService: PhotoUploadService,
    private val memberSummaryService: MemberSummaryService,
    private val photoStorage: PhotoStorage,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findByDate(
        memberId: Long,
        gender: Gender?,
        sort: FeedSort,
        date: LocalDate?,
        cursor: Long?,
        size: Int,
    ): CursorResponse<FeedPostResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val from = (date ?: today()).atStartOfDay(KOREA).toInstant()
        val to = from.plus(1, ChronoUnit.DAYS)
        val rows = when (sort) {
            FeedSort.LATEST -> feedPostRepository.findByDateLatestFirst(
                memberId = memberId,
                gender = gender?.name,
                from = from,
                to = to,
                cursor = cursor,
                size = pageSize,
            )

            FeedSort.OLDEST -> feedPostRepository.findByDateOldestFirst(
                memberId = memberId,
                gender = gender?.name,
                from = from,
                to = to,
                cursor = cursor,
                size = pageSize,
            )
        }
        val summaries = memberSummaryService.findSummaries(rows.map { it.getMemberId() }.distinct())
            .associateBy { it.memberId }

        return CursorResponse(
            items = rows.mapNotNull { row ->
                summaries[row.getMemberId()]?.let {
                    FeedPostResponse(
                        postId = row.getPostId(),
                        imageUrl = photoStorage.toPublicUrl(row.getObjectKey()),
                        slotAt = row.getSlotAt(),
                        caption = row.getCaption(),
                        likedByMe = row.getLikedByMe(),
                        memberId = it.memberId,
                        nickname = it.nickname,
                    )
                }
            },
            nextCursor = rows.lastOrNull()?.getPostId().takeIf { rows.size == pageSize },
        )
    }

    @Transactional
    fun create(memberId: Long, request: CreateFeedPostRequest) {
        validatePhotoKey(memberId, request.objectKey)

        val slotAt = currentSlot()

        if (feedPostRepository.existsByMemberIdAndSlotAt(memberId, slotAt)) {
            throw BusinessException(ErrorCode.DUPLICATE_FEED_POST)
        }

        feedPostRepository.saveAndFlush(
            FeedPost(
                memberId = memberId,
                slotAt = slotAt,
                objectKey = request.objectKey,
                caption = request.caption?.ifEmpty { null },
            ),
        )
        photoUploadService.confirm(listOf(request.objectKey))
    }

    fun createPhotoUploadUrl(memberId: Long, request: CreateFeedPhotoUploadUrlRequest): FeedPhotoUploadUrlResponse {
        val issued = photoUploadService.createUploadUrl(memberId, photoKeyPrefix(memberId), request.contentType)

        return FeedPhotoUploadUrlResponse(issued.uploadUrl, issued.objectKey)
    }

    private fun validatePhotoKey(memberId: Long, objectKey: String) {
        if (!objectKey.startsWith(photoKeyPrefix(memberId))) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }
    }

    private fun currentSlot(): Instant = clock.instant().truncatedTo(ChronoUnit.HOURS)

    private fun today(): LocalDate = LocalDate.now(clock.withZone(KOREA))

    private fun photoKeyPrefix(memberId: Long) = "$PHOTO_KEY_ROOT/$memberId/"

    companion object {

        private const val PHOTO_KEY_ROOT = "feeds"

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
