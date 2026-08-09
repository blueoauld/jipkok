package com.blueoauld.server.domain.profileview.web

import com.blueoauld.server.domain.profileview.dto.response.ProfileViewResponse
import com.blueoauld.server.domain.profileview.service.ProfileViewService
import com.blueoauld.server.global.response.ScrollResponse
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members")
class ProfileViewController(

    private val profileViewService: ProfileViewService,
) {

    @Operation(summary = "내 프로필 조회 목록", description = "같은 회원은 한 번만 담기고 최근 조회순으로 준다.")
    @GetMapping("/me/profile-views")
    fun findViewers(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): ScrollResponse<ProfileViewResponse> = profileViewService.findViewers(memberId, cursor, size)

    @Operation(summary = "확인하지 않은 프로필 조회 수")
    @GetMapping("/me/profile-views/new-count")
    fun countNew(@AuthenticationPrincipal memberId: Long): Int = profileViewService.countNew(memberId)

    @Operation(summary = "프로필 조회 목록 확인 처리")
    @PostMapping("/me/profile-views/seen")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun markSeen(@AuthenticationPrincipal memberId: Long) {
        profileViewService.markSeen(memberId)
    }

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
