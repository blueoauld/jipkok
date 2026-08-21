package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.AdminWorryStatus
import com.blueoauld.server.domain.admin.dto.response.AdminWorryCommentReportPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminWorryPostReportPageResponse
import com.blueoauld.server.domain.admin.service.AdminWorryService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin")
class AdminWorryController(

    private val adminWorryService: AdminWorryService,
) {

    @Operation(summary = "고민 신고 목록", description = "고민 신고는 자동 삭제가 없어 관리자가 직접 처리한다.")
    @GetMapping("/worry-reports")
    fun findPostReports(
        @RequestParam(required = false) status: AdminWorryStatus?,
        @RequestParam(required = false) authorId: Long?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminWorryPostReportPageResponse = adminWorryService.findPostReports(
        status = status,
        authorId = authorId,
        page = page,
        size = size,
    )

    @Operation(summary = "고민 댓글 신고 목록", description = "신고가 쌓여 자동 삭제된 댓글도 함께 준다.")
    @GetMapping("/worry-comment-reports")
    fun findCommentReports(
        @RequestParam(required = false) status: AdminWorryStatus?,
        @RequestParam(required = false) authorId: Long?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminWorryCommentReportPageResponse = adminWorryService.findCommentReports(
        status = status,
        authorId = authorId,
        page = page,
        size = size,
    )

    @Operation(summary = "고민 삭제")
    @DeleteMapping("/worry-posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deletePost(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable postId: Long,
    ) {
        adminWorryService.deletePost(actorId, postId)
    }

    @Operation(summary = "고민 댓글 삭제")
    @DeleteMapping("/worry-comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteComment(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable commentId: Long,
    ) {
        adminWorryService.deleteComment(actorId, commentId)
    }
}
