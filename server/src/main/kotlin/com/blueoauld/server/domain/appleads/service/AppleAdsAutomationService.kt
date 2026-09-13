package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsActionCommand
import com.blueoauld.server.domain.appleads.dto.AppleAdsAutomationResult
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendation
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendationType
import com.blueoauld.server.domain.appleads.entity.AppleAdsAutomation
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.domain.appleads.repository.AppleAdsActionRepository
import com.blueoauld.server.domain.appleads.repository.AppleAdsAutomationRepository
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.today
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Clock
import java.time.Period

private val log = KotlinLogging.logger {}

@Service
class AppleAdsAutomationService(

    private val automationRepository: AppleAdsAutomationRepository,
    private val actionRepository: AppleAdsActionRepository,
    private val recommender: AppleAdsRecommender,
    private val actionService: AppleAdsActionService,
    private val clock: Clock,
) {

    @Transactional
    fun settings(): AppleAdsAutomation =
        automationRepository.findById(AppleAdsAutomation.SINGLETON_ID).orElseGet {
            automationRepository.save(AppleAdsAutomation())
        }

    @Transactional
    fun updateSettings(
        actorId: Long,
        enabled: Boolean,
        dailyLimit: Int,
        pauseKeyword: Boolean,
        addNegativeKeyword: Boolean,
        lowerBid: Boolean,
        raiseBid: Boolean,
        addKeyword: Boolean,
        maxBid: BigDecimal?,
    ): AppleAdsAutomation = settings().also {
        it.update(
            enabled = enabled,
            dailyLimit = dailyLimit,
            pauseKeyword = pauseKeyword,
            addNegativeKeyword = addNegativeKeyword,
            lowerBid = lowerBid,
            raiseBid = raiseBid,
            addKeyword = addKeyword,
            maxBid = maxBid,
            updatedById = actorId,
        )
    }

    fun run(): AppleAdsAutomationResult {
        val settings = settings()

        if (!settings.enabled) {
            return AppleAdsAutomationResult(enabled = false, candidates = 0, applied = 0, failed = 0, remaining = 0)
        }

        val today = clock.today()
        val endDate = today.minus(ATTRIBUTION_LAG)
        val startDate = endDate.minusDays(WINDOW_DAYS - 1)
        val recommendations = recommender.recommend(startDate, endDate, null).items
            .filter { settings.allows(actionTypeOf(it.type)) }
            .mapNotNull { capRaisedBid(it, settings.maxBid) }

        val appliedToday = actionRepository.countByAutomaticTrueAndCreatedAtAfter(
            today.atStartOfDay(KOREA).toInstant(),
        )
        val remaining = (settings.dailyLimit - appliedToday).coerceAtLeast(0).toInt()

        var applied = 0
        var failed = 0

        for (recommendation in recommendations) {
            if (applied >= remaining || applied + failed >= remaining * ATTEMPTS_PER_SLOT) {
                break
            }

            runCatching { actionService.apply(null, commandOf(recommendation), automatic = true) }
                .onSuccess { applied++ }
                .onFailure {
                    failed++
                    log.error(it) {
                        "애플 광고 자동 조치를 적용하지 못했다. type=${recommendation.type} reason=${recommendation.reason}"
                    }
                }
        }

        log.info { "애플 광고 자동 조치를 돌렸다. 후보=${recommendations.size} 적용=$applied 실패=$failed 오늘 한도 잔여=$remaining" }

        return AppleAdsAutomationResult(
            enabled = true,
            candidates = recommendations.size,
            applied = applied,
            failed = failed,
            remaining = remaining,
        )
    }

    private fun capRaisedBid(recommendation: AppleAdsRecommendation, maxBid: BigDecimal?): AppleAdsRecommendation? {
        if (maxBid == null || recommendation.type != AppleAdsRecommendationType.RAISE_BID) {
            return recommendation
        }

        val currentBid = recommendation.currentBid ?: return null
        val suggestedBid = recommendation.suggestedBid ?: return null

        if (currentBid >= maxBid) {
            return null
        }

        return recommendation.copy(suggestedBid = minOf(suggestedBid, maxBid))
    }

    private fun commandOf(recommendation: AppleAdsRecommendation) = AppleAdsActionCommand(
        type = actionTypeOf(recommendation.type),
        campaignId = recommendation.campaignId,
        adGroupId = recommendation.adGroupId,
        adGroupName = recommendation.adGroupName,
        keywordId = recommendation.keywordId,
        keyword = recommendation.keyword,
        matchType = recommendation.matchType,
        searchTerm = recommendation.searchTerm,
        currentBid = recommendation.currentBid,
        suggestedBid = recommendation.suggestedBid,
        currency = recommendation.currency,
        reason = recommendation.reason,
    )

    companion object {

        const val WINDOW_DAYS = 30L

        val ATTRIBUTION_LAG: Period = Period.ofDays(3)

        private const val ATTEMPTS_PER_SLOT = 2

        fun actionTypeOf(type: AppleAdsRecommendationType): AppleAdsActionType = when (type) {
            AppleAdsRecommendationType.PAUSE_KEYWORD -> AppleAdsActionType.PAUSE_KEYWORD
            AppleAdsRecommendationType.ADD_NEGATIVE_KEYWORD -> AppleAdsActionType.ADD_NEGATIVE_KEYWORD
            AppleAdsRecommendationType.LOWER_BID -> AppleAdsActionType.LOWER_BID
            AppleAdsRecommendationType.RAISE_BID -> AppleAdsActionType.RAISE_BID
            AppleAdsRecommendationType.ADD_KEYWORD -> AppleAdsActionType.ADD_KEYWORD
        }
    }
}
