package com.blueoauld.server.domain.block.web

import com.blueoauld.server.domain.block.dto.request.ContactBlockRequest
import com.blueoauld.server.domain.block.service.ContactBlockService
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members/me/contact-blocks")
class ContactBlockController(

    private val contactBlockService: ContactBlockService,
) {

    @Operation(summary = "아는 사람 차단 번호 등록")
    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun replace(@AuthenticationPrincipal memberId: Long, @Valid @RequestBody request: ContactBlockRequest) {
        contactBlockService.replace(memberId, request.phoneNumbers)
    }

    @Operation(summary = "아는 사람 차단 해제")
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun clear(@AuthenticationPrincipal memberId: Long) {
        contactBlockService.clear(memberId)
    }

    @Operation(summary = "아는 사람 차단 번호 수")
    @GetMapping("/count")
    fun count(@AuthenticationPrincipal memberId: Long): Long = contactBlockService.count(memberId)
}
