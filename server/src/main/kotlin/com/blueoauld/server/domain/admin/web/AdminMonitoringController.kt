package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AdminMonitoringResponse
import com.blueoauld.server.domain.admin.service.AdminMonitoringService
import com.blueoauld.server.global.monitoring.dto.MonitoringRange
import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/monitoring")
class AdminMonitoringController(

    private val adminMonitoringService: AdminMonitoringService,
) {

    @Operation(
        summary = "서버 모니터링 위젯",
        description = "CloudWatch 대시보드의 지표 위젯을 PNG(base64)로 그려 준다. 60초 동안 같은 이미지를 준다. " +
            "대시보드 이름이 설정돼 있지 않으면 configured=false에 빈 목록이다.",
    )
    @GetMapping("/widgets")
    fun findWidgets(@RequestParam(defaultValue = "H3") range: MonitoringRange): AdminMonitoringResponse =
        adminMonitoringService.findWidgets(range)
}
