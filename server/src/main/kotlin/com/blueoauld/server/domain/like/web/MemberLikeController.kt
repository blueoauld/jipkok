package com.blueoauld.server.domain.like.web

import com.blueoauld.server.domain.like.service.MemberLikeService
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.global.response.CursorResponse
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

    @PostMapping("/{memberId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun like(@AuthenticationPrincipal likerId: Long, @PathVariable memberId: Long) {
        memberLikeService.like(likerId, memberId)
    }

    @DeleteMapping("/{memberId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun cancel(@AuthenticationPrincipal likerId: Long, @PathVariable memberId: Long) {
        memberLikeService.cancel(likerId, memberId)
    }

    @GetMapping("/me/likes")
    fun findLiked(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<MemberSummaryResponse> = memberLikeService.findLiked(memberId, cursor, size)

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
