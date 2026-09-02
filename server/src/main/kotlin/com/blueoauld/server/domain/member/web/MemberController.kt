package com.blueoauld.server.domain.member.web

import com.blueoauld.server.domain.auth.dto.response.TokenResponse
import com.blueoauld.server.domain.member.dto.request.CreateProfilePhotoUploadUrlRequest
import com.blueoauld.server.domain.member.dto.request.EditProfileRequest
import com.blueoauld.server.domain.member.dto.request.HeartbeatRequest
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.dto.request.UpdateCommentRequest
import com.blueoauld.server.domain.member.dto.request.UpdateLocaleRequest
import com.blueoauld.server.domain.member.dto.response.MemberDetailResponse
import com.blueoauld.server.domain.member.dto.response.MemberListItemResponse
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.dto.response.MyProfileResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberSort
import com.blueoauld.server.domain.member.service.MemberDetailService
import com.blueoauld.server.domain.member.service.MemberHeartbeatService
import com.blueoauld.server.domain.member.service.MemberListService
import com.blueoauld.server.domain.member.service.MemberRankingService
import com.blueoauld.server.domain.member.service.MemberSearchService
import com.blueoauld.server.domain.member.service.MemberService
import com.blueoauld.server.domain.member.service.MemberSignupService
import com.blueoauld.server.domain.member.service.MemberWithdrawService
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.global.request.EnabledRequest
import com.blueoauld.server.global.response.ScrollResponse
import com.blueoauld.server.global.storage.dto.PhotoUploadUrlResponse
import com.blueoauld.server.global.web.RequestLoggingFilter
import com.blueoauld.server.global.web.clientIp
import io.swagger.v3.oas.annotations.Operation
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members")
class MemberController(

    private val memberService: MemberService,
    private val memberListService: MemberListService,
    private val memberSearchService: MemberSearchService,
    private val memberRankingService: MemberRankingService,
    private val memberDetailService: MemberDetailService,
    private val memberWithdrawService: MemberWithdrawService,
    private val memberSignupService: MemberSignupService,
    private val memberHeartbeatService: MemberHeartbeatService,
) {

    @Operation(summary = "회원가입")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun signup(@Valid @RequestBody request: SignupRequest): TokenResponse = memberSignupService.signup(request)

    @Operation(
        operationId = "findMembers",
        summary = "회원 목록 조회",
        description = "거리순은 내 위치가 없으면 최근순으로 준다.",
    )
    @GetMapping
    fun findMembers(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(defaultValue = "RECENT") sort: MemberSort,
        @RequestParam(required = false) gender: Gender?,
        @RequestParam(required = false) minAge: Int?,
        @RequestParam(required = false) maxAge: Int?,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): ScrollResponse<MemberListItemResponse> =
        memberListService.findMembers(memberId, sort, gender, minAge, maxAge, cursor, size)

    @Operation(summary = "좋아요 랭킹")
    @GetMapping("/ranking")
    fun findRanking(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) gender: Gender?,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): ScrollResponse<MemberListItemResponse> = memberRankingService.findRanking(memberId, gender, cursor, size)

    @Operation(summary = "닉네임 검색")
    @GetMapping("/search")
    fun searchByNickname(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam keyword: String,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): ScrollResponse<MemberSummaryResponse> = memberSearchService.searchByNickname(memberId, keyword, cursor, size)

    @Operation(operationId = "findMemberDetail", summary = "회원 조회")
    @GetMapping("/{targetId}")
    fun findDetail(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable targetId: Long,
    ): MemberDetailResponse = memberDetailService.findDetail(memberId, targetId)

    @Operation(summary = "프로필 설정")
    @PatchMapping("/me/profile")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun setupProfile(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: SetupProfileRequest,
    ) {
        memberService.setupProfile(memberId, request)
    }

    @Operation(
        operationId = "withdrawMe",
        summary = "회원 탈퇴",
        description = "대화와 피드가 함께 사라지며 되돌릴 수 없다.",
    )
    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun withdraw(@AuthenticationPrincipal memberId: Long) {
        memberWithdrawService.withdraw(memberId)
    }

    @Operation(summary = "내 프로필 조회")
    @GetMapping("/me")
    fun findMyProfile(
        @AuthenticationPrincipal memberId: Long,
    ): MyProfileResponse = memberService.findMyProfile(memberId)

    @Operation(summary = "프로필 편집")
    @PutMapping("/me/profile")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun editProfile(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: EditProfileRequest,
    ) {
        memberService.editProfile(memberId, request)
    }

    @Operation(operationId = "createMemberPhotoUploadUrl", summary = "사진 업로드 URL 발급")
    @PostMapping("/me/photos/upload-url")
    fun createPhotoUploadUrl(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreateProfilePhotoUploadUrlRequest,
    ): PhotoUploadUrlResponse = memberService.createPhotoUploadUrl(memberId, request)

    @Operation(summary = "쪽지 수신 설정", description = "끄면 새 쪽지로 방이 열리지 않는다.")
    @PutMapping("/me/note-receive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun updateNoteReceive(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: EnabledRequest,
    ) {
        memberService.updateNoteReceive(memberId, request)
    }

    @Operation(summary = "피드 알림 설정")
    @PutMapping("/me/feed-notification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun updateFeedNotification(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: EnabledRequest,
    ) {
        memberService.updateFeedNotification(memberId, request)
    }

    @Operation(summary = "언어 저장", description = "번역과 푸시 문구가 이 언어를 따른다.")
    @PutMapping("/me/locale")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun updateLocale(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: UpdateLocaleRequest,
    ) {
        memberService.updateLocale(memberId, request.locale)
    }

    @Operation(summary = "코멘트 저장")
    @PutMapping("/me/comment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun updateComment(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: UpdateCommentRequest,
    ) {
        memberService.updateComment(memberId, request)
    }

    @Operation(summary = "접속과 위치 갱신", description = "하루 한 번 접속 보상을 준다.")
    @PostMapping("/me/heartbeat")
    fun heartbeat(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: HeartbeatRequest,
        @RequestHeader(RequestLoggingFilter.APP_VERSION_HEADER, required = false) appVersion: String?,
        servletRequest: HttpServletRequest,
    ): PointRewardResponse =
        memberHeartbeatService.heartbeat(memberId, request, servletRequest.clientIp(), appVersion)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
