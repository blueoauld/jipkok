package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordSummaryRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendation
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendationResult
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendationType
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermSummaryRow
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.domain.appleads.repository.AppleAdsActionRepository
import com.blueoauld.server.domain.appleads.repository.AppleAdsSummaryRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Clock
import java.time.Duration
import java.time.LocalDate

@Service
class AppleAdsRecommender(

    private val summaryRepository: AppleAdsSummaryRepository,
    private val actionRepository: AppleAdsActionRepository,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun recommend(startDate: LocalDate, endDate: LocalDate, campaignId: Long?): AppleAdsRecommendationResult {
        val keywords = summaryRepository.summarizeKeywords(startDate, endDate, campaignId)
        val allSearchTerms = summaryRepository.summarizeSearchTerms(startDate, endDate, campaignId, null)
        val searchTerms = allSearchTerms.filter { it.searchTermSource == SEARCH_MATCH }
        val keywordMatchedInstalls = allSearchTerms
            .filter { it.searchTermSource == KEYWORD_MATCH }
            .groupBy { it.adGroupId to normalize(it.searchTerm) }
            .mapValues { (_, rows) -> rows.sumOf { it.totalInstalls } }

        val installs = keywords.sumOf { it.totalInstalls }
        val spend = keywords.fold(BigDecimal.ZERO) { acc, it -> acc + it.spend }
        val currency = keywords.firstNotNullOfOrNull { it.currency }
        val baseline = perUnit(spend, installs)
        val liveKeywords = keywords.filterNot { it.deleted }
        val existingKeywords = liveKeywords.map { normalize(it.keyword) }.toSet()
        val cooldownSince = clock.instant().minus(COOLDOWN)
        val recentActions = actionRepository.findAllByCreatedAtAfterOrRevertedAtAfter(cooldownSince, cooldownSince)
        val searchTermActions = actionRepository.findAllByTypeInAndRevertedAtIsNull(SEARCH_TERM_ACTION_TYPES)
        val actedKeywordIds = recentActions.mapNotNull { it.keywordId }.toSet()
        val actedSearchTerms = (recentActions + searchTermActions).mapNotNull { action ->
            action.searchTerm?.let { action.adGroupId to normalize(it) }
        }.toSet()

        val items = liveKeywords
            .filterNot { it.keywordId in actedKeywordIds }
            .mapNotNull { keywordRecommendation(it, baselineWithout(it, spend, installs)) } +
            searchTerms
                .filterNot { (it.adGroupId to normalize(it.searchTerm)) in actedSearchTerms }
                .mapNotNull { searchTermRecommendation(it, existingKeywords, liveKeywords, keywordMatchedInstalls) }

        return AppleAdsRecommendationResult(
            baselineCostPerInstall = baseline,
            baselineInstalls = installs,
            baselineSpend = spend.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
            currency = currency,
            items = items.sortedWith(compareBy<AppleAdsRecommendation> { it.type }.thenByDescending { it.spend }),
        )
    }

    private fun baselineWithout(row: AppleAdsKeywordSummaryRow, spend: BigDecimal, installs: Long): BigDecimal? =
        perUnit(spend - row.spend, installs - row.totalInstalls)?.takeIf { it.signum() > 0 }

    private fun keywordRecommendation(row: AppleAdsKeywordSummaryRow, baseline: BigDecimal?): AppleAdsRecommendation? {
        if (row.keywordStatus != ACTIVE) {
            return null
        }

        if (row.totalInstalls == 0L && row.taps >= PAUSE_MIN_TAPS) {
            return fromKeyword(
                type = AppleAdsRecommendationType.PAUSE_KEYWORD,
                row = row,
                suggestedBid = null,
                reason = "탭 ${row.taps}회 동안 설치가 없다. 지출 ${money(row.spend, row.currency)}.",
            )
        }

        val bid = row.bidAmount ?: return null

        if (baseline == null) {
            return null
        }

        if (row.totalInstalls == 0L) {
            if (row.taps < BID_MIN_TAPS) {
                return null
            }

            return fromKeyword(
                type = AppleAdsRecommendationType.LOWER_BID,
                row = row,
                suggestedBid = scaleBid(bid * LOWER_BID_STEP),
                reason = "탭 ${row.taps}회 동안 설치가 없다. 다른 키워드의 설치당 비용은 ${money(baseline, row.currency)}다.",
            )
        }

        val costPerInstall = perUnit(row.spend, row.totalInstalls) ?: return null

        if (row.taps >= BID_MIN_TAPS && costPerInstall >= baseline * LOWER_BID_RATIO) {
            return fromKeyword(
                type = AppleAdsRecommendationType.LOWER_BID,
                row = row,
                suggestedBid = scaleBid(bid * LOWER_BID_STEP),
                reason = "설치당 비용 ${money(costPerInstall, row.currency)}가 다른 키워드 설치당 비용 " +
                    "${money(baseline, row.currency)}의 ${LOWER_BID_RATIO}배 이상이다.",
            )
        }

        if (row.totalInstalls >= RAISE_MIN_INSTALLS && costPerInstall <= baseline * RAISE_BID_RATIO) {
            val step = scaleBid(bid * RAISE_BID_STEP)
            val appleSuggested = row.suggestedBidAmount?.takeIf { it > bid }
            val suggested = appleSuggested?.let { minOf(it, step) } ?: step
            val appleNote = appleSuggested?.let { " 애플 제안 입찰가 ${money(it, row.currency)}를 넘지 않는다." }.orEmpty()

            return fromKeyword(
                type = AppleAdsRecommendationType.RAISE_BID,
                row = row,
                suggestedBid = suggested,
                reason = "설치 ${row.totalInstalls}회, 설치당 비용 ${money(costPerInstall, row.currency)}로 " +
                    "다른 키워드 설치당 비용 ${money(baseline, row.currency)}의 " +
                    "${RAISE_BID_RATIO.movePointRight(2).toInt()}% 이하다.$appleNote",
            )
        }

        return null
    }

    private fun searchTermRecommendation(
        row: AppleAdsSearchTermSummaryRow,
        existingKeywords: Set<String>,
        keywords: List<AppleAdsKeywordSummaryRow>,
        keywordMatchedInstalls: Map<Pair<Long, String>, Long>,
    ): AppleAdsRecommendation? {
        val term = normalize(row.searchTerm)

        if (term in existingKeywords) {
            return null
        }

        if (row.totalInstalls == 0L && row.taps >= NEGATIVE_MIN_TAPS) {
            if ((keywordMatchedInstalls[row.adGroupId to term] ?: 0L) > 0L) {
                return null
            }

            return fromSearchTerm(
                type = AppleAdsRecommendationType.ADD_NEGATIVE_KEYWORD,
                row = row,
                suggestedBid = null,
                reason = "Search Match로 탭 ${row.taps}회에 설치가 없다. 지출 ${money(row.spend, row.currency)}.",
            )
        }

        if (row.totalInstalls >= ADD_KEYWORD_MIN_INSTALLS) {
            val costPerInstall = perUnit(row.spend, row.totalInstalls)
            val bid = keywords
                .filter { it.adGroupId == row.adGroupId && it.keywordStatus == ACTIVE }
                .mapNotNull { it.bidAmount }
                .maxOrNull()
                ?: return null

            return fromSearchTerm(
                type = AppleAdsRecommendationType.ADD_KEYWORD,
                row = row,
                suggestedBid = bid,
                reason = "Search Match로 설치 ${row.totalInstalls}회, 설치당 비용 " +
                    "${money(costPerInstall ?: BigDecimal.ZERO, row.currency)}다. 정확 일치 키워드로 두면 입찰가를 따로 정할 수 있다.",
            )
        }

        return null
    }

    private fun fromKeyword(
        type: AppleAdsRecommendationType,
        row: AppleAdsKeywordSummaryRow,
        suggestedBid: BigDecimal?,
        reason: String,
    ) = AppleAdsRecommendation(
        type = type,
        campaignId = row.campaignId,
        adGroupId = row.adGroupId,
        adGroupName = row.adGroupName,
        keywordId = row.keywordId,
        keyword = row.keyword,
        matchType = row.matchType,
        searchTerm = null,
        currentBid = row.bidAmount,
        suggestedBid = suggestedBid,
        currency = row.currency,
        impressions = row.impressions,
        taps = row.taps,
        totalInstalls = row.totalInstalls,
        spend = row.spend.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
        costPerInstall = perUnit(row.spend, row.totalInstalls),
        reason = reason,
    )

    private fun fromSearchTerm(
        type: AppleAdsRecommendationType,
        row: AppleAdsSearchTermSummaryRow,
        suggestedBid: BigDecimal?,
        reason: String,
    ) = AppleAdsRecommendation(
        type = type,
        campaignId = row.campaignId,
        adGroupId = row.adGroupId,
        adGroupName = row.adGroupName,
        keywordId = row.keywordId,
        keyword = row.keyword,
        matchType = row.matchType,
        searchTerm = row.searchTerm,
        currentBid = null,
        suggestedBid = suggestedBid,
        currency = row.currency,
        impressions = row.impressions,
        taps = row.taps,
        totalInstalls = row.totalInstalls,
        spend = row.spend.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
        costPerInstall = perUnit(row.spend, row.totalInstalls),
        reason = reason,
    )

    companion object {

        const val PAUSE_MIN_TAPS = 20L
        const val BID_MIN_TAPS = 10L
        const val RAISE_MIN_INSTALLS = 3L
        const val NEGATIVE_MIN_TAPS = 10L
        const val ADD_KEYWORD_MIN_INSTALLS = 2L

        val COOLDOWN: Duration = Duration.ofDays(14)

        val SEARCH_TERM_ACTION_TYPES = listOf(AppleAdsActionType.ADD_NEGATIVE_KEYWORD, AppleAdsActionType.ADD_KEYWORD)

        val LOWER_BID_RATIO: BigDecimal = BigDecimal("1.5")
        val RAISE_BID_RATIO: BigDecimal = BigDecimal("0.7")
        val LOWER_BID_STEP: BigDecimal = BigDecimal("0.85")
        val RAISE_BID_STEP: BigDecimal = BigDecimal("1.15")

        private const val ACTIVE = "ACTIVE"
        private const val SEARCH_MATCH = "AUTO"
        private const val KEYWORD_MATCH = "TARGETED"
        private const val MONEY_SCALE = 2

        private val MIN_BID = BigDecimal("0.01")

        private fun normalize(text: String) = text.trim().lowercase()

        private fun perUnit(amount: BigDecimal, count: Long): BigDecimal? =
            if (count == 0L) null else amount.divide(BigDecimal.valueOf(count), MONEY_SCALE, RoundingMode.HALF_UP)

        private fun scaleBid(amount: BigDecimal): BigDecimal =
            maxOf(amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP), MIN_BID)

        private fun money(amount: BigDecimal, currency: String?): String {
            val value = amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP).toPlainString()

            return if (currency == null) value else "$value $currency"
        }
    }
}
