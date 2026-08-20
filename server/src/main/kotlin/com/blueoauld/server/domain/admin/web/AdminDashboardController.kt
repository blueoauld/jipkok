package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AccessEnvironmentResponse
import com.blueoauld.server.domain.admin.dto.response.ActiveUsersResponse
import com.blueoauld.server.domain.admin.dto.response.DashboardSummaryResponse
import com.blueoauld.server.domain.admin.dto.response.DemographicsResponse
import com.blueoauld.server.domain.admin.dto.response.RecentActivityResponse
import com.blueoauld.server.domain.admin.dto.response.TrendPointResponse
import com.blueoauld.server.domain.admin.service.AdminDashboardService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/dashboard")
class AdminDashboardController(

    private val adminDashboardService: AdminDashboardService,
) {

    @Operation(summary = "운영 요약")
    @GetMapping("/summary")
    fun findSummary(): DashboardSummaryResponse = adminDashboardService.findSummary()

    @Operation(summary = "가입, 탈퇴, 신고 추이")
    @GetMapping("/trend")
    fun findTrend(): List<TrendPointResponse> = adminDashboardService.findTrend()

    @Operation(summary = "활성 회원")
    @GetMapping("/active-users")
    fun findActiveUsers(): ActiveUsersResponse = adminDashboardService.findActiveUsers()

    @Operation(summary = "회원 구성")
    @GetMapping("/demographics")
    fun findDemographics(): DemographicsResponse = adminDashboardService.findDemographics()

    @Operation(summary = "접속 환경")
    @GetMapping("/access-environment")
    fun findAccessEnvironment(): AccessEnvironmentResponse = adminDashboardService.findAccessEnvironment()

    @Operation(summary = "최근 신고와 정지")
    @GetMapping("/recent")
    fun findRecent(): RecentActivityResponse = adminDashboardService.findRecent()
}
