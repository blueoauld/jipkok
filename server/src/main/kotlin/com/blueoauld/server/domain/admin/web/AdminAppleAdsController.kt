package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsOrgResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsSyncResponse
import com.blueoauld.server.domain.admin.service.AdminAppleAdsService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/api/admin/apple-ads")
class AdminAppleAdsController(

    private val adminAppleAdsService: AdminAppleAdsService,
) {

    @Operation(
        summary = "애플 광고 조직 목록",
        description = "API 사용자가 접근할 수 있는 조직을 애플 광고에서 가져온다. 인증 연동이 되는지 확인하고 orgId를 얻는 데 쓴다.",
    )
    @GetMapping("/orgs")
    fun findOrgs(): List<AdminAppleAdsOrgResponse> = adminAppleAdsService.findOrgs()

    @Operation(
        summary = "애플 광고 리포트 적재",
        description = "기간의 키워드, 검색어 일별 리포트를 애플 광고에서 받아 저장한다. 이미 있는 날은 덮어쓴다. " +
            "기간은 90일까지, 시작일은 오늘부터 90일 전까지다.",
    )
    @PostMapping("/reports/sync")
    fun syncReports(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
    ): AdminAppleAdsSyncResponse = adminAppleAdsService.syncReports(startDate, endDate)
}
