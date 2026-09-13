package com.blueoauld.server.domain.appleads.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AppleAdsQueriesTest {

    @Autowired
    private lateinit var campaignRepository: AppleAdsCampaignRepository

    @Autowired
    private lateinit var keywordDailyRepository: AppleAdsKeywordDailyRepository

    @Autowired
    private lateinit var searchTermDailyRepository: AppleAdsSearchTermDailyRepository

    @Autowired
    private lateinit var summaryRepository: AppleAdsSummaryRepository

    @Autowired
    private lateinit var actionRepository: AppleAdsActionRepository

    @Test
    fun `같은 캠페인을 다시 받으면 이름과 상태만 갱신한다`() {
        // given
        campaignRepository.upsert(id = CAMPAIGN_ID, name = "Jipkok KR", status = "ENABLED", deleted = false, now = NOW)

        // when
        campaignRepository.upsert(id = CAMPAIGN_ID, name = "Jipkok", status = "PAUSED", deleted = true, now = LATER)

        // then
        val campaigns = campaignRepository.findAll().filter { it.id == CAMPAIGN_ID }
        assertThat(campaigns).hasSize(1)
        assertThat(campaigns.single().name).isEqualTo("Jipkok")
        assertThat(campaigns.single().status).isEqualTo("PAUSED")
        assertThat(campaigns.single().deleted).isTrue()
    }

    @Test
    fun `같은 키워드의 같은 날을 다시 받으면 지표를 덮어쓴다`() {
        // given
        upsertKeyword(impressions = 10, spend = BigDecimal("1.00"), now = NOW)

        // when
        upsertKeyword(impressions = 25, spend = BigDecimal("2.50"), now = LATER)

        // then
        val rows = keywordDailyRepository.findAll().filter { it.keywordId == KEYWORD_ID }
        assertThat(rows).hasSize(1)
        assertThat(rows.single().impressions).isEqualTo(25)
        assertThat(rows.single().spend).isEqualByComparingTo(BigDecimal("2.50"))
    }

    @Test
    fun `키워드 없는 검색어도 같은 날이면 한 행으로 덮어쓴다`() {
        // given
        upsertSearchTerm(keywordId = null, impressions = 10, now = NOW)
        upsertSearchTerm(keywordId = KEYWORD_ID, impressions = 5, now = NOW)

        // when
        upsertSearchTerm(keywordId = null, impressions = 30, now = LATER)

        // then
        val rows = searchTermDailyRepository.findAll().filter { it.searchTerm == SEARCH_TERM }
        assertThat(rows).hasSize(2)
        assertThat(rows.single { it.keywordId == null }.impressions).isEqualTo(30)
        assertThat(rows.single { it.keywordId == KEYWORD_ID }.impressions).isEqualTo(5)
    }

    @Test
    fun `키워드 성과는 기간을 합산하고 상태는 가장 최근 날 값을 쓴다`() {
        // given
        upsertKeyword(impressions = 10, spend = BigDecimal("1.00"), now = NOW)
        upsertKeyword(
            impressions = 20,
            spend = BigDecimal("2.00"),
            now = NOW,
            reportDate = NEXT_DATE,
            status = "PAUSED",
            deleted = true,
        )
        upsertKeyword(impressions = 99, spend = BigDecimal("9.00"), now = NOW, reportDate = NEXT_DATE.plusDays(1))
        upsertKeyword(
            impressions = 5,
            spend = BigDecimal("0.50"),
            now = NOW,
            keywordId = OTHER_KEYWORD_ID,
            campaignId = OTHER_CAMPAIGN_ID,
        )

        // when
        val rows = summaryRepository.summarizeKeywords(REPORT_DATE, NEXT_DATE, null)
        val filtered = summaryRepository.summarizeKeywords(REPORT_DATE, NEXT_DATE, OTHER_CAMPAIGN_ID)

        // then
        val row = rows.single { it.keywordId == KEYWORD_ID }
        assertThat(row.impressions).isEqualTo(30)
        assertThat(row.spend).isEqualByComparingTo(BigDecimal("3.00"))
        assertThat(row.keywordStatus).isEqualTo("PAUSED")
        assertThat(row.deleted).isTrue()
        assertThat(rows.single { it.keywordId == OTHER_KEYWORD_ID }.deleted).isFalse()
        assertThat(row.suggestedBidAmount).isEqualByComparingTo(BigDecimal("2.40"))
        assertThat(row.bidMin).isNull()
        assertThat(rows.map { it.keywordId }).containsExactly(KEYWORD_ID, OTHER_KEYWORD_ID)
        assertThat(filtered.map { it.keywordId }).containsExactly(OTHER_KEYWORD_ID)
    }

    @Test
    fun `검색어 성과는 출처로 거르고 키워드 없는 검색어도 묶는다`() {
        // given
        upsertSearchTerm(keywordId = null, impressions = 10, now = NOW)
        upsertSearchTerm(keywordId = null, impressions = 20, now = NOW, reportDate = NEXT_DATE)
        upsertSearchTerm(keywordId = KEYWORD_ID, impressions = 5, now = NOW, source = "TARGETED")

        // when
        val all = summaryRepository.summarizeSearchTerms(REPORT_DATE, NEXT_DATE, CAMPAIGN_ID, null)
        val auto = summaryRepository.summarizeSearchTerms(REPORT_DATE, NEXT_DATE, CAMPAIGN_ID, "AUTO")

        // then
        assertThat(all).hasSize(2)
        assertThat(all[0].keywordId).isNull()
        assertThat(all[0].impressions).isEqualTo(30)
        assertThat(all[1].keywordId).isEqualTo(KEYWORD_ID)
        assertThat(auto).hasSize(1)
        assertThat(auto.single().searchTermSource).isEqualTo("AUTO")
    }

    @Test
    fun `최근에 만들었거나 최근에 되돌린 조치를 찾는다`() {
        // given
        val kept = actionRepository.save(action(keywordId = KEYWORD_ID))
        val reverted = actionRepository.save(action(keywordId = OTHER_KEYWORD_ID))
        val createdThreshold = kept.createdAt.minusSeconds(1)
        val revertedThreshold = reverted.createdAt.plusSeconds(1)
        reverted.revert(2L, revertedThreshold.plusSeconds(60))
        actionRepository.saveAndFlush(reverted)

        // when
        val createdRecently = actionRepository.findAllByCreatedAtAfterOrRevertedAtAfter(
            createdThreshold,
            createdThreshold,
        )
        val revertedRecently = actionRepository.findAllByCreatedAtAfterOrRevertedAtAfter(
            revertedThreshold,
            revertedThreshold,
        )

        // then
        assertThat(createdRecently.map { it.id }).contains(kept.id, reverted.id)
        assertThat(revertedRecently.map { it.id }).contains(reverted.id).doesNotContain(kept.id)
    }

    @Test
    fun `되돌리지 않은 검색어 조치는 기간과 상관없이 유형으로 찾는다`() {
        // given
        val negative = actionRepository.save(action(type = AppleAdsActionType.ADD_NEGATIVE_KEYWORD))
        val reverted = actionRepository.save(action(type = AppleAdsActionType.ADD_NEGATIVE_KEYWORD))
        reverted.revert(2L, NOW)
        actionRepository.saveAndFlush(reverted)
        val paused = actionRepository.save(action(keywordId = KEYWORD_ID))

        // when
        val found = actionRepository.findAllByTypeInAndRevertedAtIsNull(
            listOf(AppleAdsActionType.ADD_NEGATIVE_KEYWORD, AppleAdsActionType.ADD_KEYWORD),
        )

        // then
        assertThat(found.map { it.id }).contains(negative.id).doesNotContain(reverted.id, paused.id)
    }

    @Test
    fun `같은 키워드나 검색어에 더 나중의 되돌리지 않은 조치가 있는지 본다`() {
        // given
        val first = actionRepository.save(action(keywordId = KEYWORD_ID))
        val later = actionRepository.save(action(keywordId = KEYWORD_ID))
        val firstNegative = actionRepository.save(
            action(type = AppleAdsActionType.ADD_NEGATIVE_KEYWORD, searchTerm = "디스코드"),
        )
        val laterNegative = actionRepository.save(
            action(type = AppleAdsActionType.ADD_NEGATIVE_KEYWORD, searchTerm = "디스코드"),
        )
        laterNegative.revert(2L, NOW)
        actionRepository.saveAndFlush(laterNegative)

        // when
        val firstHasLater = actionRepository.existsByIdGreaterThanAndKeywordIdAndRevertedAtIsNull(first.id, KEYWORD_ID)
        val laterHasLater = actionRepository.existsByIdGreaterThanAndKeywordIdAndRevertedAtIsNull(later.id, KEYWORD_ID)
        val searchTermHasLater = actionRepository.existsByIdGreaterThanAndAdGroupIdAndSearchTermAndRevertedAtIsNull(
            firstNegative.id,
            AD_GROUP_ID,
            "디스코드",
        )

        // then
        assertThat(firstHasLater).isTrue()
        assertThat(laterHasLater).isFalse()
        assertThat(searchTermHasLater).isFalse()
    }

    private fun action(
        type: AppleAdsActionType = AppleAdsActionType.PAUSE_KEYWORD,
        keywordId: Long? = null,
        searchTerm: String? = null,
    ) = AppleAdsAction(
        actorId = 1L,
        automatic = false,
        type = type,
        campaignId = CAMPAIGN_ID,
        adGroupId = AD_GROUP_ID,
        adGroupName = "Ad Group 1",
        keywordId = keywordId,
        keyword = "dating app",
        matchType = "EXACT",
        searchTerm = searchTerm,
        negativeKeywordId = null,
        previousBid = null,
        newBid = null,
        currency = "USD",
        previousStatus = "ACTIVE",
        newStatus = "PAUSED",
        reason = null,
    )

    private fun upsertKeyword(
        impressions: Long,
        spend: BigDecimal,
        now: Instant,
        reportDate: LocalDate = REPORT_DATE,
        status: String = "ACTIVE",
        deleted: Boolean = false,
        keywordId: Long = KEYWORD_ID,
        campaignId: Long = CAMPAIGN_ID,
    ) {
        keywordDailyRepository.upsert(
            reportDate = reportDate,
            campaignId = campaignId,
            adGroupId = AD_GROUP_ID,
            adGroupName = "Ad Group 1",
            keywordId = keywordId,
            keyword = "dating app",
            matchType = "EXACT",
            keywordStatus = status,
            deleted = deleted,
            bidAmount = BigDecimal("1.50"),
            suggestedBidAmount = BigDecimal("2.40"),
            bidMin = null,
            bidMax = null,
            currency = "USD",
            impressions = impressions,
            taps = 1,
            totalInstalls = 1,
            tapInstalls = 1,
            viewInstalls = 0,
            totalNewDownloads = 1,
            totalRedownloads = 0,
            spend = spend,
            now = now,
        )
    }

    private fun upsertSearchTerm(
        keywordId: Long?,
        impressions: Long,
        now: Instant,
        reportDate: LocalDate = REPORT_DATE,
        source: String = "AUTO",
    ) {
        searchTermDailyRepository.upsert(
            reportDate = reportDate,
            campaignId = CAMPAIGN_ID,
            adGroupId = AD_GROUP_ID,
            adGroupName = "Ad Group 1",
            keywordId = keywordId,
            keyword = keywordId?.let { "dating app" },
            matchType = keywordId?.let { "EXACT" },
            searchTerm = SEARCH_TERM,
            searchTermSource = source,
            countryOrRegion = "KR",
            currency = "USD",
            impressions = impressions,
            taps = 1,
            totalInstalls = 0,
            tapInstalls = 0,
            viewInstalls = 0,
            totalNewDownloads = 0,
            totalRedownloads = 0,
            spend = BigDecimal("0.50"),
            now = now,
        )
    }

    companion object {

        private const val CAMPAIGN_ID = 900_000_001L
        private const val AD_GROUP_ID = 900_000_002L
        private const val KEYWORD_ID = 900_000_003L
        private const val OTHER_CAMPAIGN_ID = 900_000_004L
        private const val OTHER_KEYWORD_ID = 900_000_005L
        private const val SEARCH_TERM = "소개팅 앱"

        private val REPORT_DATE: LocalDate = LocalDate.of(2026, 9, 1)
        private val NEXT_DATE: LocalDate = LocalDate.of(2026, 9, 2)
        private val NOW: Instant = Instant.parse("2026-09-06T00:00:00Z")
        private val LATER: Instant = NOW.plusSeconds(3600)
    }
}
