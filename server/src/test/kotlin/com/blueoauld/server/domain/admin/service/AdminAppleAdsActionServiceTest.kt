package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.request.ApplyAppleAdsActionRequest
import com.blueoauld.server.domain.appleads.dto.AppleAdsActionCommand
import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.domain.appleads.repository.AppleAdsActionRepository
import com.blueoauld.server.domain.appleads.service.AppleAdsActionService
import com.blueoauld.server.domain.member.service.MemberAdminService
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.Instant

class AdminAppleAdsActionServiceTest {

    private val actionService = mockk<AppleAdsActionService>()

    private val actionRepository = mockk<AppleAdsActionRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val service = AdminAppleAdsActionService(actionService, actionRepository, memberAdminService)

    @Test
    fun `요청을 명령으로 옮기고 처리자와 되돌린 사람 닉네임을 붙인다`() {
        // given
        val action = AppleAdsAction(
            actorId = ACTOR_ID,
            automatic = false,
            type = AppleAdsActionType.LOWER_BID,
            campaignId = CAMPAIGN_ID,
            adGroupId = AD_GROUP_ID,
            adGroupName = "Ad Group 1",
            keywordId = KEYWORD_ID,
            keyword = "dating app",
            matchType = "EXACT",
            searchTerm = null,
            negativeKeywordId = null,
            previousBid = BigDecimal("1.45"),
            newBid = BigDecimal("1.23"),
            currency = "USD",
            previousStatus = null,
            newStatus = null,
            reason = "기준보다 비싸다.",
        ).also { it.revert(REVERTER_ID, Instant.parse("2026-09-06T12:00:00Z")) }
        val command = slot<AppleAdsActionCommand>()
        every { actionService.apply(ACTOR_ID, capture(command)) } returns action
        every { memberAdminService.findNicknames(listOf(ACTOR_ID, REVERTER_ID)) } returns
            mapOf(ACTOR_ID to "관리자", REVERTER_ID to "다른 관리자")

        // when
        val response = service.apply(
            ACTOR_ID,
            ApplyAppleAdsActionRequest(
                type = AppleAdsActionType.LOWER_BID,
                campaignId = CAMPAIGN_ID,
                adGroupId = AD_GROUP_ID,
                keywordId = KEYWORD_ID,
                currentBid = BigDecimal("1.45"),
                suggestedBid = BigDecimal("1.23"),
                currency = "USD",
                reason = "기준보다 비싸다.",
            ),
        )

        // then
        assertThat(command.captured.type).isEqualTo(AppleAdsActionType.LOWER_BID)
        assertThat(command.captured.suggestedBid).isEqualByComparingTo(BigDecimal("1.23"))
        assertThat(response.actorNickname).isEqualTo("관리자")
        assertThat(response.automatic).isFalse()
        assertThat(response.revertedByNickname).isEqualTo("다른 관리자")
        assertThat(response.newBid).isEqualByComparingTo(BigDecimal("1.23"))
    }

    companion object {

        private const val ACTOR_ID = 1L
        private const val REVERTER_ID = 2L
        private const val CAMPAIGN_ID = 1000L
        private const val AD_GROUP_ID = 10L
        private const val KEYWORD_ID = 500L
    }
}
