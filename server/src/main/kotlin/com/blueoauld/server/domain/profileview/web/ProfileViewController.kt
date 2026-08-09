package com.blueoauld.server.domain.profileview.web

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.profileview.service.ProfileViewService
import com.blueoauld.server.global.response.ScrollResponse
import io.swagger.v3.oas.annotations.Operation
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
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
    ): ScrollResponse<MemberSummaryResponse> = profileViewService.findViewers(memberId, cursor, size)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
