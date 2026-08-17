package com.blueoauld.server.domain.feed.web

import com.blueoauld.server.domain.feed.dto.request.CreateFeedPostRequest
import com.blueoauld.server.domain.feed.dto.response.FeedPostResponse
import com.blueoauld.server.domain.feed.entity.type.FeedSort
import com.blueoauld.server.domain.feed.service.FeedPostLikeService
import com.blueoauld.server.domain.feed.service.FeedPostReportService
import com.blueoauld.server.domain.feed.service.FeedPostService
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.storage.dto.CreatePhotoUploadUrlRequest
import com.blueoauld.server.global.storage.dto.PhotoUploadUrlResponse
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/api/feeds")
class FeedPostController(

    private val feedPostService: FeedPostService,
    private val feedPostLikeService: FeedPostLikeService,
    private val feedPostReportService: FeedPostReportService,
) {

    @Operation(summary = "피드 목록 조회", description = "날짜를 생략하면 오늘 피드를 준다.")
    @GetMapping
    fun findByDate(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) gender: Gender?,
        @RequestParam(defaultValue = "LATEST") sort: FeedSort,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate?,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<FeedPostResponse> = feedPostService.findByDate(memberId, gender, sort, date, cursor, size)

    @Operation(operationId = "createFeedPost", summary = "피드 작성", description = "한 시간대에 하나만 올릴 수 있다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreateFeedPostRequest,
    ) {
        feedPostService.create(memberId, request)
    }

    @Operation(operationId = "likeFeedPost", summary = "피드 좋아요")
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

    @Operation(operationId = "reportFeedPost", summary = "피드 신고")
    @PostMapping("/{postId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    fun report(@AuthenticationPrincipal memberId: Long, @PathVariable postId: Long) {
        feedPostReportService.report(memberId, postId)
    }

    @Operation(operationId = "createFeedPhotoUploadUrl", summary = "피드 사진 업로드 URL 발급")
    @PostMapping("/photos/upload-url")
    fun createPhotoUploadUrl(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreatePhotoUploadUrlRequest,
    ): PhotoUploadUrlResponse = feedPostService.createPhotoUploadUrl(memberId, request)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
