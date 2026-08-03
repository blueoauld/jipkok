package com.blueoauld.server.domain.auth.web

import com.blueoauld.server.domain.auth.dto.request.SendVerificationCodeRequest
import com.blueoauld.server.domain.auth.service.VerificationCodeService
import com.blueoauld.server.global.web.clientIp
import io.swagger.v3.oas.annotations.Operation
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth/verification-codes")
class VerificationCodeController(

    private val verificationCodeService: VerificationCodeService,
) {

    @Operation(summary = "인증번호 발송")
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun send(@Valid @RequestBody request: SendVerificationCodeRequest, servletRequest: HttpServletRequest) {
        verificationCodeService.send(request.phoneNumber, servletRequest.clientIp())
    }
}
