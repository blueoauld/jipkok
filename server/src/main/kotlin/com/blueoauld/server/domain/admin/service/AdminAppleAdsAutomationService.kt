package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.request.UpdateAppleAdsAutomationRequest
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsAutomationResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsAutomationRunResponse
import com.blueoauld.server.domain.appleads.entity.AppleAdsAutomation
import com.blueoauld.server.domain.appleads.service.AppleAdsAutomationService
import com.blueoauld.server.domain.member.service.MemberAdminService
import org.springframework.stereotype.Service

@Service
class AdminAppleAdsAutomationService(

    private val automationService: AppleAdsAutomationService,
    private val memberAdminService: MemberAdminService,
) {

    fun findSettings(): AdminAppleAdsAutomationResponse = toResponse(automationService.settings())

    fun updateSettings(actorId: Long, request: UpdateAppleAdsAutomationRequest): AdminAppleAdsAutomationResponse =
        toResponse(
            automationService.updateSettings(
                actorId = actorId,
                enabled = requireNotNull(request.enabled),
                dailyLimit = requireNotNull(request.dailyLimit),
                pauseKeyword = requireNotNull(request.pauseKeyword),
                addNegativeKeyword = requireNotNull(request.addNegativeKeyword),
                lowerBid = requireNotNull(request.lowerBid),
                raiseBid = requireNotNull(request.raiseBid),
                addKeyword = requireNotNull(request.addKeyword),
                maxBid = request.maxBid,
            ),
        )

    fun run(): AdminAppleAdsAutomationRunResponse {
        val result = automationService.run()

        return AdminAppleAdsAutomationRunResponse(
            enabled = result.enabled,
            candidates = result.candidates,
            applied = result.applied,
            failed = result.failed,
            remaining = result.remaining,
        )
    }

    private fun toResponse(settings: AppleAdsAutomation): AdminAppleAdsAutomationResponse {
        val nickname = settings.updatedById?.let { memberAdminService.findNicknames(listOf(it))[it] }

        return AdminAppleAdsAutomationResponse(
            enabled = settings.enabled,
            dailyLimit = settings.dailyLimit,
            pauseKeyword = settings.pauseKeyword,
            addNegativeKeyword = settings.addNegativeKeyword,
            lowerBid = settings.lowerBid,
            raiseBid = settings.raiseBid,
            addKeyword = settings.addKeyword,
            maxBid = settings.maxBid,
            updatedById = settings.updatedById,
            updatedByNickname = nickname,
            updatedAt = settings.updatedAt,
        )
    }
}
