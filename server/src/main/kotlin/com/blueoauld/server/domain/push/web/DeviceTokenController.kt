package com.blueoauld.server.domain.push.web

import com.blueoauld.server.domain.push.dto.request.RegisterDeviceTokenRequest
import com.blueoauld.server.domain.push.service.DeviceTokenService
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members/me/device-tokens")
class DeviceTokenController(

    private val deviceTokenService: DeviceTokenService,
) {

    @Operation(summary = "푸시 토큰 등록", description = "기기마다 하나씩 등록한다.")
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun register(
        @AuthenticationPrincipal memberId: Long,
        @Valid @RequestBody request: RegisterDeviceTokenRequest,
    ) {
        deviceTokenService.register(memberId, request)
    }

    @Operation(operationId = "removeDeviceToken", summary = "푸시 토큰 해제")
    @DeleteMapping("/{token}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun remove(
        @AuthenticationPrincipal memberId: Long,
        @PathVariable token: String,
    ) {
        deviceTokenService.remove(memberId, token)
    }
}
