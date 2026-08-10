package com.blueoauld.server.domain.favorite.web

import com.blueoauld.server.domain.favorite.service.MemberFavoriteService
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
class MemberFavoriteController(

    private val memberFavoriteService: MemberFavoriteService,
) {

    @Operation(operationId = "addFavorite", summary = "즐겨찾기 추가")
    @PostMapping("/{memberId}/favorites")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun add(@AuthenticationPrincipal loginMemberId: Long, @PathVariable memberId: Long) {
        memberFavoriteService.add(loginMemberId, memberId)
    }

    @Operation(operationId = "removeFavorite", summary = "즐겨찾기 해제")
    @DeleteMapping("/{memberId}/favorites")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun remove(@AuthenticationPrincipal loginMemberId: Long, @PathVariable memberId: Long) {
        memberFavoriteService.remove(loginMemberId, memberId)
    }

    @Operation(summary = "즐겨찾기 목록")
    @GetMapping("/me/favorites")
    fun findFavorites(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<MemberSummaryResponse> = memberFavoriteService.findFavorites(memberId, cursor, size)

    @Operation(operationId = "findReceivedFavorites", summary = "받은 즐겨찾기 목록")
    @GetMapping("/me/favorites/received")
    fun findReceived(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<MemberSummaryResponse> = memberFavoriteService.findReceived(memberId, cursor, size)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
