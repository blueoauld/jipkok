package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsOrgResponse
import com.blueoauld.server.domain.admin.service.AdminAppleAdsService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

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
}
