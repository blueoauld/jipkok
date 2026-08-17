package com.blueoauld.server.domain.auth.web

import com.blueoauld.server.domain.auth.dto.request.LoginRequest
import com.blueoauld.server.domain.auth.dto.request.ReissueRequest
import com.blueoauld.server.domain.auth.dto.request.ResetPasswordRequest
import com.blueoauld.server.domain.auth.dto.response.TokenResponse
import com.blueoauld.server.domain.auth.service.AuthService
import com.blueoauld.server.domain.auth.service.PasswordResetService
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
@RequestMapping("/api/auth")
class AuthController(

    private val authService: AuthService,
    private val passwordResetService: PasswordResetService,
) {

    @Operation(summary = "로그인", description = "번호와 IP마다 시도 횟수를 제한한다.")
    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        servletRequest: HttpServletRequest,
    ): TokenResponse = authService.login(request, servletRequest.clientIp())

    @Operation(summary = "토큰 재발급")
    @PostMapping("/token/reissue")
    fun reissue(@Valid @RequestBody request: ReissueRequest): TokenResponse = authService.reissue(request)

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun logout(@Valid @RequestBody request: ReissueRequest) {
        authService.logout(request.refreshToken)
    }

    @Operation(
        summary = "비밀번호 재설정",
        description = "인증번호를 확인하고 바꾼다. 다른 기기의 로그인은 모두 끊긴다.",
    )
    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun resetPassword(@Valid @RequestBody request: ResetPasswordRequest) {
        passwordResetService.reset(request)
    }
}
