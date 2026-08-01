package com.blueoauld.server.domain.member.web

import com.blueoauld.server.domain.member.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.member.dto.request.EditProfileRequest
import com.blueoauld.server.domain.member.dto.request.HeartbeatRequest
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.dto.request.UpdateCommentRequest
import com.blueoauld.server.domain.member.dto.response.MyProfileResponse
import com.blueoauld.server.domain.member.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.member.dto.response.SignupResponse
import com.blueoauld.server.domain.member.service.MemberService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
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

    @GetMapping("/me")
    fun getMyProfile(@AuthenticationPrincipal memberId: Long): MyProfileResponse = memberService.getMyProfile(memberId)

    @PutMapping("/me/profile")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun editProfile(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: EditProfileRequest,
    ) {
        memberService.editProfile(memberId, request)
    }

    @PostMapping("/me/photos/upload-url")
    fun createPhotoUploadUrl(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreatePhotoUploadUrlRequest,
    ): PhotoUploadUrlResponse = memberService.createPhotoUploadUrl(memberId, request)

    @PutMapping("/me/comment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun updateComment(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: UpdateCommentRequest,
    ) {
        memberService.updateComment(memberId, request)
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
