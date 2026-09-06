package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.request.ApplyAppleAdsActionRequest
import com.blueoauld.server.domain.admin.dto.request.UpdateAppleAdsAutomationRequest
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsActionPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsActionResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsAutomationResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsAutomationRunResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsCampaignResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsKeywordListResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsOrgResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsRecommendationListResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsSearchTermListResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsSyncResponse
import com.blueoauld.server.domain.admin.service.AdminAppleAdsActionService
import com.blueoauld.server.domain.admin.service.AdminAppleAdsAutomationService
import com.blueoauld.server.domain.admin.service.AdminAppleAdsReportService
import com.blueoauld.server.domain.admin.service.AdminAppleAdsService
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/api/admin/apple-ads")
class AdminAppleAdsController(

    private val adminAppleAdsService: AdminAppleAdsService,
    private val adminAppleAdsReportService: AdminAppleAdsReportService,
    private val adminAppleAdsActionService: AdminAppleAdsActionService,
    private val adminAppleAdsAutomationService: AdminAppleAdsAutomationService,
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

    @Operation(
        summary = "애플 광고 조치 추천",
        description = "기간 성과를 규칙에 대어 일시정지, 제외 키워드, 입찰가 조정, 키워드 추가를 추천한다. " +
            "기준은 기간의 키워드 설치당 비용이고, 표본이 모자란 항목은 추천하지 않는다. 적용은 하지 않는다.",
    )
    @GetMapping("/recommendations")
    fun findRecommendations(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(required = false) campaignId: Long?,
    ): AdminAppleAdsRecommendationListResponse =
        adminAppleAdsReportService.findRecommendations(startDate, endDate, campaignId)

    @Operation(
        summary = "애플 광고 조치 적용",
        description = "추천을 애플 광고에 실제로 적용하고 이력을 남긴다. 일시정지와 입찰가 변경은 keywordId, " +
            "제외 키워드와 키워드 추가는 searchTerm이 필요하고, 입찰가 변경과 키워드 추가는 suggestedBid와 currency도 필요하다.",
    )
    @PostMapping("/actions")
    fun applyAppleAdsAction(
        @AuthenticationPrincipal actorId: Long,
        @Valid @RequestBody request: ApplyAppleAdsActionRequest,
    ): AdminAppleAdsActionResponse = adminAppleAdsActionService.apply(actorId, request)

    @Operation(
        summary = "애플 광고 조치 되돌리기",
        description = "입찰가는 이전 값으로, 일시정지는 재개로 돌리고 제외 키워드와 추가한 키워드는 지운다. 한 번만 되돌릴 수 있다.",
    )
    @PostMapping("/actions/{actionId}/revert")
    fun revertAppleAdsAction(
        @AuthenticationPrincipal actorId: Long,
        @PathVariable actionId: Long,
    ): AdminAppleAdsActionResponse = adminAppleAdsActionService.revert(actorId, actionId)

    @Operation(summary = "애플 광고 조치 이력", description = "적용한 조치를 최신순으로 준다.")
    @GetMapping("/actions")
    fun findAppleAdsActions(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): AdminAppleAdsActionPageResponse = adminAppleAdsActionService.findActions(page, size)

    @Operation(summary = "애플 광고 자동 실행 설정", description = "켜짐 여부, 하루 한도, 유형별 허용 여부다.")
    @GetMapping("/automation")
    fun findAutomation(): AdminAppleAdsAutomationResponse = adminAppleAdsAutomationService.findSettings()

    @Operation(
        summary = "애플 광고 자동 실행 설정 변경",
        description = "매일 06시 리포트 적재 뒤에 켜져 있으면 추천을 허용된 유형만 하루 한도까지 자동 적용한다.",
    )
    @PutMapping("/automation")
    fun updateAutomation(
        @AuthenticationPrincipal actorId: Long,
        @Valid @RequestBody request: UpdateAppleAdsAutomationRequest,
    ): AdminAppleAdsAutomationResponse = adminAppleAdsAutomationService.updateSettings(actorId, request)

    @Operation(
        summary = "애플 광고 자동 실행 지금 돌리기",
        description = "스케줄과 같은 규칙으로 바로 한 번 돌린다. 꺼져 있으면 아무것도 하지 않고 enabled=false를 준다.",
    )
    @PostMapping("/automation/run")
    fun runAutomation(): AdminAppleAdsAutomationRunResponse = adminAppleAdsAutomationService.run()
}
