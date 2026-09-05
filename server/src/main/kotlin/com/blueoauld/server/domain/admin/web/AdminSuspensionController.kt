package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.admin.dto.request.CreateSuspensionRequest
import com.blueoauld.server.domain.admin.dto.response.AdminSuspensionPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminSuspensionResponse
import com.blueoauld.server.domain.admin.service.AdminSuspensionService
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/suspensions")
class AdminSuspensionController(

    private val adminSuspensionService: AdminSuspensionService,
) {

    @Operation(summary = "정지 목록")
    @GetMapping
    fun findSuspensions(
        @RequestParam(required = false) status: AdminSuspensionStatus?,
        @RequestParam(required = false) type: SuspensionType?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminSuspensionPageResponse = adminSuspensionService.findSuspensions(
        status = status,
        type = type,
        memberId = memberId,
        page = page,
        size = size,
    )

    @Operation(summary = "회원 정지", description = "일수가 없으면 영구 정지다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun suspend(
        @AuthenticationPrincipal actorId: Long,
        @Valid @RequestBody request: CreateSuspensionRequest,
    ): AdminSuspensionResponse = adminSuspensionService.suspend(actorId, request)

    @Operation(
        summary = "정지 해제",
        description = "같은 전화번호에 걸린 같은 유형의 유효한 정지를 모두 해제한다. 탈퇴한 계정의 정지도 해제할 수 있다.",
    )
    @PostMapping("/{suspensionId}/release")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun release(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable suspensionId: Long,
    ) {
        adminSuspensionService.release(actorId, suspensionId)
    }
}
