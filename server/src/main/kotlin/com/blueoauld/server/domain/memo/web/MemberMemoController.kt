package com.blueoauld.server.domain.memo.web

import com.blueoauld.server.domain.memo.dto.request.UpdateMemoRequest
import com.blueoauld.server.domain.memo.service.MemberMemoService
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members")
class MemberMemoController(

    private val memberMemoService: MemberMemoService,
) {

    @Operation(operationId = "updateMemberMemo", summary = "회원 메모 저장", description = "나만 보는 메모다. 비우면 지운다.")
    @PutMapping("/{memberId}/memo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun update(
        @AuthenticationPrincipal ownerId: Long,
        @PathVariable memberId: Long,
        @Valid @RequestBody request: UpdateMemoRequest,
    ) {
        memberMemoService.update(ownerId, memberId, request.content)
    }
}
