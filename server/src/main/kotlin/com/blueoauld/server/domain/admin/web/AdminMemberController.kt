package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.AdminMemberStatus
import com.blueoauld.server.domain.admin.dto.response.AdminMemberDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMemberPageResponse
import com.blueoauld.server.domain.admin.service.AdminMemberService
import com.blueoauld.server.domain.member.entity.type.Gender
import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/members")
class AdminMemberController(

    private val adminMemberService: AdminMemberService,
) {

    @Operation(summary = "회원 목록", description = "검색어는 숫자면 회원 ID와 전화번호, 아니면 닉네임에 맞춘다.")
    @GetMapping
    fun findMembers(
        @RequestParam(defaultValue = "ALL") status: AdminMemberStatus,
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

    @Operation(summary = "회원 상세", description = "탈퇴한 회원도 조회하고, 정지 이력은 전화번호 기준으로 준다.")
    @GetMapping("/{memberId}")
    fun findDetail(@PathVariable memberId: Long): AdminMemberDetailResponse =
        adminMemberService.findDetail(memberId)
}
