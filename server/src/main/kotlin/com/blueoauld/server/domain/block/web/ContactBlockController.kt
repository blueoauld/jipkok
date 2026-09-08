package com.blueoauld.server.domain.block.web

import com.blueoauld.server.domain.block.dto.request.ContactBlockRequest
import com.blueoauld.server.domain.block.dto.response.ContactBlockResponse
import com.blueoauld.server.domain.block.service.ContactBlockService
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
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members/me/contact-blocks")
class ContactBlockController(

    private val contactBlockService: ContactBlockService,
) {

    @Operation(summary = "번호 차단 목록")
    @GetMapping
    fun findAll(@AuthenticationPrincipal memberId: Long): List<ContactBlockResponse> =
        contactBlockService.findAll(memberId)

    @Operation(summary = "번호 차단")
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun add(@AuthenticationPrincipal memberId: Long, @Valid @RequestBody request: ContactBlockRequest) {
        contactBlockService.add(memberId, request.phoneNumber, request.memo)
    }

    @Operation(summary = "번호 차단 해제")
    @DeleteMapping("/{contactBlockId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun remove(@AuthenticationPrincipal memberId: Long, @PathVariable contactBlockId: Long) {
        contactBlockService.remove(memberId, contactBlockId)
    }
}
