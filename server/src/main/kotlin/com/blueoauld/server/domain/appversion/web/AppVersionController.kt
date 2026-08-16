package com.blueoauld.server.domain.appversion.web

import com.blueoauld.server.domain.appversion.dto.response.AppVersionResponse
import com.blueoauld.server.domain.appversion.service.AppVersionService
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/app")
class AppVersionController(

    private val appVersionService: AppVersionService,
) {

    @Operation(summary = "최신 앱 버전 조회", description = "스토어에 올라간 버전과 그 스토어 주소를 준다.")
    @GetMapping("/version")
    fun findLatestVersion(@RequestParam platform: DevicePlatform): AppVersionResponse =
        appVersionService.findLatest(platform)
}
