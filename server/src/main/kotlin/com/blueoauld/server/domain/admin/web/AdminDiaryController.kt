package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AdminDiaryDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminDiaryPageResponse
import com.blueoauld.server.domain.admin.service.AdminDiaryService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin")
class AdminDiaryController(

    private val adminDiaryService: AdminDiaryService,
) {

    @Operation(
        operationId = "findAdminDiaries",
        summary = "일기 목록",
        description = "최신 날짜부터 주고 본문은 첫 줄 80자까지만 담는다. 회원 ID를 주면 그 회원 것만 준다.",
    )
    @GetMapping("/diaries")
    fun findDiaries(
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminDiaryPageResponse = adminDiaryService.findDiaries(memberId, page, size)

    @Operation(
        operationId = "findAdminDiary",
        summary = "일기 상세",
        description = "본문 전체와 첨부의 서명 URL을 준다. 조회할 때마다 열람 기록을 조치 이력에 남긴다.",
    )
    @GetMapping("/diaries/{diaryId}")
    fun findDiary(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable diaryId: Long,
    ): AdminDiaryDetailResponse = adminDiaryService.findDiary(actorId, diaryId)
}
