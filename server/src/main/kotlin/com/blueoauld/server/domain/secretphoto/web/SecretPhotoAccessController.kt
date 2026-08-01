package com.blueoauld.server.domain.secretphoto.web

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.secretphoto.service.SecretPhotoAccessService
import com.blueoauld.server.global.response.CursorResponse
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
class SecretPhotoAccessController(

    private val secretPhotoAccessService: SecretPhotoAccessService,
) {

    @PostMapping("/{memberId}/secret-photos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun grant(@AuthenticationPrincipal ownerId: Long, @PathVariable memberId: Long) {
        secretPhotoAccessService.grant(ownerId, memberId)
    }

    @DeleteMapping("/{memberId}/secret-photos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun revoke(@AuthenticationPrincipal ownerId: Long, @PathVariable memberId: Long) {
        secretPhotoAccessService.revoke(ownerId, memberId)
    }

    @GetMapping("/me/secret-photos/granted")
    fun findGranted(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<MemberSummaryResponse> = secretPhotoAccessService.findGranted(memberId, cursor, size)

    @GetMapping("/me/secret-photos/received")
    fun findReceived(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<MemberSummaryResponse> = secretPhotoAccessService.findReceived(memberId, cursor, size)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
