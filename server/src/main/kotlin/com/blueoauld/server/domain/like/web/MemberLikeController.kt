package com.blueoauld.server.domain.like.web

import com.blueoauld.server.domain.like.service.MemberLikeService
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.global.response.CursorResponse
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members")
class MemberLikeController(

    private val memberLikeService: MemberLikeService,
) {

    @Operation(operationId = "likeMember", summary = "좋아요")
    @PostMapping("/{memberId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun like(@AuthenticationPrincipal likerId: Long, @PathVariable memberId: Long) {
        memberLikeService.like(likerId, memberId)
    }

    @Operation(operationId = "cancelMemberLike", summary = "좋아요 취소")
    @DeleteMapping("/{memberId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun cancel(@AuthenticationPrincipal likerId: Long, @PathVariable memberId: Long) {
        memberLikeService.cancel(likerId, memberId)
    }

    @Operation(summary = "내가 누른 좋아요 목록")
    @GetMapping("/me/likes")
    fun findLiked(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<MemberSummaryResponse> = memberLikeService.findLiked(memberId, cursor, size)

    @Operation(operationId = "findReceivedLikes", summary = "받은 좋아요 목록")
    @GetMapping("/me/likes/received")
    fun findReceived(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<MemberSummaryResponse> = memberLikeService.findReceived(memberId, cursor, size)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
