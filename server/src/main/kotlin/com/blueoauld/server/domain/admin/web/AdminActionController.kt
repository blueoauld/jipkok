package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AdminActionPageResponse
import com.blueoauld.server.domain.admin.service.AdminActionService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/actions")
class AdminActionController(

    private val adminActionService: AdminActionService,
) {

    @Operation(summary = "관리자 조치 이력", description = "정지, 해제, 초기화, 탈퇴, 삭제, 신고 처리 기록을 최신순으로 준다.")
    @GetMapping
    fun findActions(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminActionPageResponse = adminActionService.findActions(page, size)
}
