package com.blueoauld.server.domain.worry.web

import com.blueoauld.server.domain.worry.dto.request.CreateWorryCommentRequest
import com.blueoauld.server.domain.worry.dto.request.CreateWorryPostRequest
import com.blueoauld.server.domain.worry.dto.response.WorryCommentResponse
import com.blueoauld.server.domain.worry.dto.response.WorryPostResponse
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import com.blueoauld.server.domain.worry.entity.type.WorrySort
import com.blueoauld.server.domain.worry.service.WorryCommentReportService
import com.blueoauld.server.domain.worry.service.WorryCommentService
import com.blueoauld.server.domain.worry.service.WorryPostLikeService
import com.blueoauld.server.domain.worry.service.WorryPostReportService
import com.blueoauld.server.domain.worry.service.WorryPostService
import com.blueoauld.server.global.response.CursorResponse
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
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

@RestController
@RequestMapping("/api/worries")
class WorryController(

    private val worryPostService: WorryPostService,
    private val worryPostLikeService: WorryPostLikeService,
    private val worryPostReportService: WorryPostReportService,
    private val worryCommentService: WorryCommentService,
    private val worryCommentReportService: WorryCommentReportService,
) {

    @Operation(summary = "고민 목록 조회", description = "작성자 정보는 담기지 않고 category를 비우면 전체를 준다.")
    @GetMapping
    fun find(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(defaultValue = "LATEST") sort: WorrySort,
        @RequestParam(required = false) category: WorryCategory?,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<WorryPostResponse> = worryPostService.find(memberId, sort, category, cursor, size)

    @Operation(operationId = "createWorryPost", summary = "고민 작성", description = "하루에 다섯 개까지 올릴 수 있다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreateWorryPostRequest,
    ) {
        worryPostService.create(memberId, request)
    }

    @Operation(summary = "내가 쓴 고민 목록")
    @GetMapping("/me")
    fun findMine(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<WorryPostResponse> = worryPostService.findMine(memberId, cursor, size)

    @Operation(summary = "고민 검색", description = "내용으로 찾고 두 글자 이상부터 검색한다.")
    @GetMapping("/search")
    fun search(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam keyword: String,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<WorryPostResponse> = worryPostService.search(memberId, keyword, cursor, size)

    @Operation(summary = "고민 상세 조회")
    @GetMapping("/{postId}")
    fun findDetail(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable postId: Long,
    ): WorryPostResponse = worryPostService.findDetail(memberId, postId)

    @Operation(operationId = "deleteWorryPost", summary = "고민 삭제", description = "본인 글만 지울 수 있다.")
    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@AuthenticationPrincipal memberId: Long, @PathVariable postId: Long) {
        worryPostService.delete(memberId, postId)
    }

    @Operation(operationId = "likeWorryPost", summary = "고민 공감")
    @PostMapping("/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun like(@AuthenticationPrincipal memberId: Long, @PathVariable postId: Long) {
        worryPostLikeService.like(memberId, postId)
    }

    @Operation(summary = "고민 공감 취소")
    @DeleteMapping("/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun cancelLike(@AuthenticationPrincipal memberId: Long, @PathVariable postId: Long) {
        worryPostLikeService.cancel(memberId, postId)
    }

    @Operation(operationId = "reportWorryPost", summary = "고민 신고")
    @PostMapping("/{postId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    fun report(@AuthenticationPrincipal memberId: Long, @PathVariable postId: Long) {
        worryPostReportService.report(memberId, postId)
    }

    @Operation(summary = "고민 댓글 목록 조회", description = "오래된 순으로 주고 답글은 부모 댓글 뒤에 붙는다.")
    @GetMapping("/{postId}/comments")
    fun findComments(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable postId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<WorryCommentResponse> = worryCommentService.find(memberId, postId, cursor, size)

    @Operation(
        operationId = "createWorryComment",
        summary = "고민 댓글 작성",
        description = "parentId를 주면 그 댓글의 답글이 된다. 답글에는 답글을 달 수 없다.",
    )
    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    fun createComment(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable postId: Long,
        @Valid @RequestBody request: CreateWorryCommentRequest,
    ) {
        worryCommentService.create(memberId, postId, request)
    }

    @Operation(operationId = "deleteWorryComment", summary = "고민 댓글 삭제", description = "본인 댓글만 지울 수 있다.")
    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteComment(@AuthenticationPrincipal memberId: Long, @PathVariable commentId: Long) {
        worryCommentService.delete(memberId, commentId)
    }

    @Operation(operationId = "reportWorryComment", summary = "고민 댓글 신고")
    @PostMapping("/comments/{commentId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    fun reportComment(@AuthenticationPrincipal memberId: Long, @PathVariable commentId: Long) {
        worryCommentReportService.report(memberId, commentId)
    }

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
