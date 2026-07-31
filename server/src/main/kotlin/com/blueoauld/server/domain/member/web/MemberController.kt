package com.blueoauld.server.domain.member.web

import com.blueoauld.server.domain.member.dto.request.HeartbeatRequest
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.dto.response.SignupResponse
import com.blueoauld.server.domain.member.service.MemberService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members")
class MemberController(

    private val memberService: MemberService,
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun signup(@Valid @RequestBody request: SignupRequest): SignupResponse = memberService.signup(request)

    @PatchMapping("/me/profile")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun setupProfile(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: SetupProfileRequest,
    ) {
        memberService.setupProfile(memberId, request)
    }

    @PostMapping("/me/heartbeat")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun heartbeat(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: HeartbeatRequest,
    ) {
        memberService.heartbeat(memberId, request)
    }
}
