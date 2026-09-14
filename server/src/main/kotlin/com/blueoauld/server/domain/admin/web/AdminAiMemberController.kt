package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AdminAiMemberDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAiMemberPageResponse
import com.blueoauld.server.domain.admin.service.AdminAiMemberService
import com.blueoauld.server.domain.ai.dto.request.CreateAiMemberRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberPhotosRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberRequest
import com.blueoauld.server.domain.member.dto.request.CreateProfilePhotoUploadUrlRequest
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/ai-members")
class AdminAiMemberController(

    private val adminAiMemberService: AdminAiMemberService,
) {

    @Operation(
        operationId = "findAdminAiMembers",
        summary = "AI 계정 목록",
        description = "탈퇴 처리된 AI 계정은 빠진다. 검색어는 닉네임에 맞춘다.",
    )
    @GetMapping
    fun findMembers(
        @RequestParam(required = false) enabled: Boolean?,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminAiMemberPageResponse = adminAiMemberService.findMembers(
        enabled = enabled,
        keyword = keyword,
        page = page,
        size = size,
    )

    @Operation(
        operationId = "createAiMember",
        summary = "AI 계정 생성",
        description = "회원 행과 페르소나를 함께 만든다. 전화번호는 로그인할 수 없는 형식으로 자동 생성된다.",
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @AuthenticationPrincipal actorId: Long,
        @Valid @RequestBody request: CreateAiMemberRequest,
    ): AdminAiMemberDetailResponse = adminAiMemberService.create(actorId, request)

    @Operation(operationId = "findAdminAiMemberDetail", summary = "AI 계정 상세")
    @GetMapping("/{memberId}")
    fun findDetail(@PathVariable memberId: Long): AdminAiMemberDetailResponse =
        adminAiMemberService.findDetail(memberId)

    @Operation(
        operationId = "updateAiMember",
        summary = "AI 계정 수정",
        description = "성별은 바꿀 수 없다. 좌표를 바꾸면 다음 위치 갱신 때부터 반영된다.",
    )
    @PutMapping("/{memberId}")
    fun update(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable memberId: Long,
        @Valid @RequestBody request: UpdateAiMemberRequest,
    ): AdminAiMemberDetailResponse = adminAiMemberService.update(actorId, memberId, request)

    @Operation(
        operationId = "createAiMemberPhotoUploadUrl",
        summary = "AI 계정 사진 업로드 URL 발급",
        description = "회원 프로필 사진과 같은 규칙으로 발급한다. 올린 뒤 사진 목록을 저장해야 반영된다.",
    )
    @PostMapping("/{memberId}/photo-upload-url")
    fun createPhotoUploadUrl(
        @PathVariable memberId: Long,
        @RequestBody request: CreateProfilePhotoUploadUrlRequest,
    ): PhotoUploadUrlResponse = adminAiMemberService.createPhotoUploadUrl(memberId, request)

    @Operation(
        operationId = "updateAiMemberPhotos",
        summary = "AI 계정 사진 저장",
        description = "보낸 순서대로 저장하고, 빠진 사진은 지운다.",
    )
    @PutMapping("/{memberId}/photos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun updatePhotos(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable memberId: Long,
        @Valid @RequestBody request: UpdateAiMemberPhotosRequest,
    ) {
        adminAiMemberService.updatePhotos(actorId, memberId, request)
    }

    @Operation(
        operationId = "withdrawAiMember",
        summary = "AI 계정 삭제",
        description = "회원 탈퇴와 같은 절차로 처리하고 페르소나를 지운다.",
    )
    @DeleteMapping("/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun withdraw(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable memberId: Long,
    ) {
        adminAiMemberService.withdraw(actorId, memberId)
    }
}
