package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.AdminMemberStatus
import com.blueoauld.server.domain.admin.dto.request.ResetProfileRequest
import com.blueoauld.server.domain.admin.dto.response.AdminMemberDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMemberPageResponse
import com.blueoauld.server.domain.admin.service.AdminMemberService
import com.blueoauld.server.domain.member.entity.type.Gender
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
@RequestMapping("/api/admin/members")
class AdminMemberController(

    private val adminMemberService: AdminMemberService,
) {

    @Operation(
        operationId = "findAdminMembers",
        summary = "회원 목록",
        description = "검색어는 숫자면 회원 ID와 전화번호, 아니면 닉네임에 맞춘다.",
    )
    @GetMapping
    fun findMembers(
        @RequestParam(required = false) status: AdminMemberStatus?,
        @RequestParam(required = false) gender: Gender?,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminMemberPageResponse = adminMemberService.findMembers(
        status = status,
        gender = gender,
        keyword = keyword,
        page = page,
        size = size,
    )

    @Operation(
        operationId = "findAdminMemberDetail",
        summary = "회원 상세",
        description = "탈퇴한 회원도 조회하고, 정지 이력은 전화번호 기준으로 준다. 닉네임 이력은 최신순이다.",
    )
    @GetMapping("/{memberId}")
    fun findDetail(@PathVariable memberId: Long): AdminMemberDetailResponse =
        adminMemberService.findDetail(memberId)

    @Operation(summary = "프로필 초기화", description = "닉네임은 무작위로 바꾸고 나머지 항목은 비우거나 지운다.")
    @PostMapping("/{memberId}/profile-reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun resetProfile(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable memberId: Long,
        @Valid @RequestBody request: ResetProfileRequest,
    ) {
        adminMemberService.resetProfile(actorId, memberId, request)
    }

    @Operation(
        operationId = "withdrawByAdmin",
        summary = "회원 탈퇴",
        description = "회원 탈퇴와 같은 절차로 처리한다.",
    )
    @DeleteMapping("/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun withdraw(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable memberId: Long,
    ) {
        adminMemberService.withdraw(actorId, memberId)
    }
}
