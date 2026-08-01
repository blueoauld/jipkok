package com.blueoauld.server.domain.block.web

import com.blueoauld.server.domain.block.service.MemberBlockService
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
class MemberBlockController(

    private val memberBlockService: MemberBlockService,
) {

    @PostMapping("/{memberId}/blocks")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun block(@AuthenticationPrincipal blockerId: Long, @PathVariable memberId: Long) {
        memberBlockService.block(blockerId, memberId)
    }

    @DeleteMapping("/{memberId}/blocks")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun unblock(@AuthenticationPrincipal blockerId: Long, @PathVariable memberId: Long) {
        memberBlockService.unblock(blockerId, memberId)
    }

    @GetMapping("/me/blocks")
    fun findBlocked(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<MemberSummaryResponse> = memberBlockService.findBlocked(memberId, cursor, size)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
