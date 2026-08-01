package com.blueoauld.server.domain.feed.web

import com.blueoauld.server.domain.feed.dto.request.CreateFeedPhotoUploadUrlRequest
import com.blueoauld.server.domain.feed.dto.request.CreateFeedPostRequest
import com.blueoauld.server.domain.feed.dto.response.FeedPhotoUploadUrlResponse
import com.blueoauld.server.domain.feed.service.FeedPostLikeService
import com.blueoauld.server.domain.feed.service.FeedPostReportService
import com.blueoauld.server.domain.feed.service.FeedPostService
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/feeds")
class FeedPostController(

    private val feedPostService: FeedPostService,
    private val feedPostLikeService: FeedPostLikeService,
    private val feedPostReportService: FeedPostReportService,
) {

    @Operation(summary = "피드 작성", description = "한 시간대에 하나만 올릴 수 있다.")
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun create(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreateFeedPostRequest,
    ) {
        feedPostService.create(memberId, request)
    }

    @Operation(summary = "피드 좋아요")
    @PostMapping("/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun like(@AuthenticationPrincipal memberId: Long, @PathVariable postId: Long) {
        feedPostLikeService.like(memberId, postId)
    }

    @Operation(summary = "피드 좋아요 취소")
    @DeleteMapping("/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun cancelLike(@AuthenticationPrincipal memberId: Long, @PathVariable postId: Long) {
        feedPostLikeService.cancel(memberId, postId)
    }

    @Operation(summary = "피드 신고")
    @PostMapping("/{postId}/reports")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun report(@AuthenticationPrincipal memberId: Long, @PathVariable postId: Long) {
        feedPostReportService.report(memberId, postId)
    }

    @Operation(summary = "피드 사진 업로드 URL 발급")
    @PostMapping("/photos/upload-url")
    fun createPhotoUploadUrl(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreateFeedPhotoUploadUrlRequest,
    ): FeedPhotoUploadUrlResponse = feedPostService.createPhotoUploadUrl(memberId, request)
}
