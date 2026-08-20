package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.AdminFeedPostStatus
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReportPageResponse
import com.blueoauld.server.domain.admin.service.AdminFeedService
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
class AdminFeedController(

    private val adminFeedService: AdminFeedService,
) {

    @Operation(summary = "피드 신고 목록")
    @GetMapping("/feed-reports")
    fun findReports(
        @RequestParam(required = false) status: AdminFeedPostStatus?,
        @RequestParam(required = false) authorId: Long?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminFeedReportPageResponse = adminFeedService.findReports(
        status = status,
        authorId = authorId,
        page = page,
        size = size,
    )

    @Operation(summary = "피드 게시물 삭제")
    @DeleteMapping("/feed-posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deletePost(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable postId: Long,
    ) {
        adminFeedService.deletePost(actorId, postId)
    }
}
