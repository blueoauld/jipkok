package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.dto.request.CreateFeedPhotoUploadUrlRequest
import com.blueoauld.server.domain.feed.dto.request.CreateFeedPostRequest
import com.blueoauld.server.domain.feed.dto.response.FeedPhotoUploadUrlResponse
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoUploadService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class FeedPostService(

    private val feedPostRepository: FeedPostRepository,
    private val photoUploadService: PhotoUploadService,
    private val clock: Clock,
) {

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

    private fun photoKeyPrefix(memberId: Long) = "$PHOTO_KEY_ROOT/$memberId/"

    companion object {

        private const val PHOTO_KEY_ROOT = "feeds"
    }
}
