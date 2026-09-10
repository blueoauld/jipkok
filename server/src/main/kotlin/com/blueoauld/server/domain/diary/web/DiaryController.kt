package com.blueoauld.server.domain.diary.web

import com.blueoauld.server.domain.diary.dto.request.WriteDiaryRequest
import com.blueoauld.server.domain.diary.dto.response.DiaryResponse
import com.blueoauld.server.domain.diary.service.DiaryService
import com.blueoauld.server.domain.photo.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.global.response.CursorResponse
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.format.annotation.DateTimeFormat
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
import java.time.LocalDate
import java.time.YearMonth

@RestController
@RequestMapping("/api/diaries")
class DiaryController(

    private val diaryService: DiaryService,
) {

    @Operation(summary = "월별 일기 조회", description = "그 달의 일기를 날짜순으로 전부 준다. month는 yyyy-MM 형식이고 첨부 URL은 서명되어 만료된다.")
    @GetMapping
    fun findMonth(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam month: YearMonth,
    ): List<DiaryResponse> = diaryService.findMonth(memberId, month)

    @Operation(
        summary = "일기 검색",
        description = "내 일기의 본문으로 찾고 두 글자 이상부터 검색한다. 최신 날짜부터 주고 커서는 날짜의 epoch day다.",
    )
    @GetMapping("/search")
    fun search(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam keyword: String,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<DiaryResponse> = diaryService.search(memberId, keyword, cursor, size)

    @Operation(summary = "일기 내보내기", description = "내 일기 전체를 오래된 날짜부터 첨부의 서명 URL과 함께 준다.")
    @GetMapping("/export")
    fun export(@AuthenticationPrincipal memberId: Long): List<DiaryResponse> = diaryService.export(memberId)

    @Operation(
        operationId = "createDiaryAttachmentUploadUrl",
        summary = "일기 첨부 업로드 URL 발급",
        description = "사진과 동영상, 동영상 썸네일 모두 이 URL로 올린다.",
    )
    @PostMapping("/attachments/upload-url")
    fun createAttachmentUploadUrl(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: CreatePhotoUploadUrlRequest,
    ): PhotoUploadUrlResponse = diaryService.createUploadUrl(memberId, request.contentType)

    @Operation(
        summary = "일기 쓰기",
        description = "그날 일기가 없으면 만들고 있으면 덮어쓴다. 한국 날짜로 오늘까지만 쓸 수 있고, 내용이나 첨부 중 하나는 있어야 한다. " +
            "첨부는 보낸 순서대로 남고 빠진 첨부는 지운다.",
    )
    @PutMapping("/{entryDate}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun write(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) entryDate: LocalDate,
        @Valid @RequestBody request: WriteDiaryRequest,
    ) {
        diaryService.write(memberId, entryDate, request)
    }

    @Operation(summary = "일기 삭제", description = "첨부도 함께 지운다.")
    @DeleteMapping("/{entryDate}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) entryDate: LocalDate,
    ) {
        diaryService.delete(memberId, entryDate)
    }

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
