package com.blueoauld.server.domain.translation.web

import com.blueoauld.server.domain.translation.dto.request.TranslateRequest
import com.blueoauld.server.domain.translation.dto.response.TranslationResponse
import com.blueoauld.server.domain.translation.service.TranslationService
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/translations")
class TranslationController(

    private val translationService: TranslationService,
) {

    @Operation(
        summary = "번역 조회",
        description = "회원의 언어 설정으로 번역한다. 이미 번역한 것이 있으면 그대로 준다.",
    )
    @PostMapping
    fun translate(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: TranslateRequest,
    ): TranslationResponse = translationService.translate(memberId, request)
}
