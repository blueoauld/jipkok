package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsCampaignResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsKeywordListResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsOrgResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsSearchTermListResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsSyncResponse
import com.blueoauld.server.domain.admin.service.AdminAppleAdsReportService
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
    private val adminAppleAdsReportService: AdminAppleAdsReportService,
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

    @Operation(summary = "애플 광고 캠페인 목록", description = "적재해 둔 캠페인 스냅샷이다. 필터에 쓴다.")
    @GetMapping("/campaigns")
    fun findCampaigns(): List<AdminAppleAdsCampaignResponse> = adminAppleAdsReportService.findCampaigns()

    @Operation(
        summary = "애플 광고 키워드 성과",
        description = "기간의 일별 리포트를 키워드별로 합산한다. 입찰가와 상태는 기간 안 가장 최근 값이다. 지출 내림차순이다.",
    )
    @GetMapping("/keywords")
    fun findKeywords(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(required = false) campaignId: Long?,
    ): AdminAppleAdsKeywordListResponse = adminAppleAdsReportService.findKeywords(startDate, endDate, campaignId)

    @Operation(
        summary = "애플 광고 검색어 성과",
        description = "기간의 일별 리포트를 검색어별로 합산한다. source는 AUTO(Search Match) 또는 TARGETED다. 노출 내림차순이다.",
    )
    @GetMapping("/search-terms")
    fun findSearchTerms(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(required = false) campaignId: Long?,
        @RequestParam(required = false) source: String?,
    ): AdminAppleAdsSearchTermListResponse =
        adminAppleAdsReportService.findSearchTerms(startDate, endDate, campaignId, source)
}
