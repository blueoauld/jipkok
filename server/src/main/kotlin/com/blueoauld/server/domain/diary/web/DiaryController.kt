package com.blueoauld.server.domain.diary.web

import com.blueoauld.server.domain.diary.dto.request.WriteDiaryRequest
import com.blueoauld.server.domain.diary.dto.response.DiaryResponse
import com.blueoauld.server.domain.diary.service.DiaryService
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
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

    @Operation(summary = "월별 일기 조회", description = "그 달의 일기를 날짜순으로 전부 준다. month는 yyyy-MM 형식이다.")
    @GetMapping
    fun findMonth(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam month: YearMonth,
    ): List<DiaryResponse> = diaryService.findMonth(memberId, month)

    @Operation(summary = "일기 쓰기", description = "그날 일기가 없으면 만들고 있으면 덮어쓴다. 한국 날짜로 오늘까지만 쓸 수 있다.")
    @PutMapping("/{entryDate}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun write(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) entryDate: LocalDate,
        @Valid @RequestBody request: WriteDiaryRequest,
    ) {
        diaryService.write(memberId, entryDate, request.content)
    }

    @Operation(summary = "일기 삭제")
    @DeleteMapping("/{entryDate}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) entryDate: LocalDate,
    ) {
        diaryService.delete(memberId, entryDate)
    }
}
