package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.request.ApplyAppleAdsActionRequest
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsActionPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsActionResponse
import com.blueoauld.server.domain.appleads.dto.AppleAdsActionCommand
import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import com.blueoauld.server.domain.appleads.repository.AppleAdsActionRepository
import com.blueoauld.server.domain.appleads.service.AppleAdsActionService
import com.blueoauld.server.domain.member.service.MemberAdminService
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminAppleAdsActionService(

    private val actionService: AppleAdsActionService,
    private val actionRepository: AppleAdsActionRepository,
    private val memberAdminService: MemberAdminService,
) {

    fun apply(actorId: Long, request: ApplyAppleAdsActionRequest): AdminAppleAdsActionResponse {
        val action = actionService.apply(
            actorId,
            AppleAdsActionCommand(
                type = requireNotNull(request.type),
                campaignId = requireNotNull(request.campaignId),
                adGroupId = requireNotNull(request.adGroupId),
                adGroupName = request.adGroupName,
                keywordId = request.keywordId,
                keyword = request.keyword,
                matchType = request.matchType,
                searchTerm = request.searchTerm,
                currentBid = request.currentBid,
                suggestedBid = request.suggestedBid,
                currency = request.currency,
                reason = request.reason,
            ),
        )

        return toResponse(action, nicknamesOf(listOf(action)))
    }

    fun revert(actorId: Long, actionId: Long): AdminAppleAdsActionResponse {
        val action = actionService.revert(actorId, actionId)

        return toResponse(action, nicknamesOf(listOf(action)))
    }

    @Transactional(readOnly = true)
    fun findActions(page: Int, size: Int): AdminAppleAdsActionPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)

        val actions = actionRepository.findAllByOrderByIdDesc(PageRequest.of(safePage - 1, safeSize))
        val nicknames = nicknamesOf(actions.content)

        return AdminAppleAdsActionPageResponse(
            items = actions.content.map { toResponse(it, nicknames) },
            page = safePage,
            size = safeSize,
            totalCount = actions.totalElements,
        )
    }

    private fun nicknamesOf(actions: List<AppleAdsAction>) =
        memberAdminService.findNicknames(actions.flatMap { listOfNotNull(it.actorId, it.revertedById) })

    private fun toResponse(action: AppleAdsAction, nicknames: Map<Long, String>) = AdminAppleAdsActionResponse(
        id = action.id,
        actorId = action.actorId,
        actorNickname = action.actorId?.let { nicknames[it] },
        automatic = action.automatic,
        type = action.type,
        campaignId = action.campaignId,
        adGroupId = action.adGroupId,
        adGroupName = action.adGroupName,
        keywordId = action.keywordId,
        keyword = action.keyword,
        matchType = action.matchType,
        searchTerm = action.searchTerm,
        negativeKeywordId = action.negativeKeywordId,
        previousBid = action.previousBid,
        newBid = action.newBid,
        currency = action.currency,
        previousStatus = action.previousStatus,
        newStatus = action.newStatus,
        reason = action.reason,
        revertedAt = action.revertedAt,
        revertedById = action.revertedById,
        revertedByNickname = action.revertedById?.let { nicknames[it] },
        createdAt = action.createdAt,
    )
}
