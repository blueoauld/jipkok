package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordSummaryRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendationType
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermSummaryRow
import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.domain.appleads.repository.AppleAdsActionRepository
import com.blueoauld.server.domain.appleads.repository.AppleAdsSummaryRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AppleAdsRecommenderTest {

    private val summaryRepository = mockk<AppleAdsSummaryRepository>()

    private val actionRepository = mockk<AppleAdsActionRepository>()

    private val recommender = AppleAdsRecommender(summaryRepository, actionRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `탭이 많은데 설치가 없는 키워드는 일시정지를 추천한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 20, installs = 0, spend = "9.00"),
                keyword(id = 2L, taps = 19, installs = 0, spend = "9.00"),
                keyword(id = 3L, taps = 30, installs = 0, spend = "9.00", status = "PAUSED"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.baselineCostPerInstall).isNull()
        assertThat(result.items).hasSize(1)
        assertThat(result.items[0].type).isEqualTo(AppleAdsRecommendationType.PAUSE_KEYWORD)
        assertThat(result.items[0].keywordId).isEqualTo(1L)
        assertThat(result.items[0].reason).contains("탭 20회")
    }

    @Test
    fun `다른 키워드보다 설치당 비용이 크게 높으면 입찰가를 낮추라고 한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 10, installs = 1, spend = "12.00", bid = "1.45"),
                keyword(id = 2L, taps = 10, installs = 5, spend = "8.00", bid = "1.45"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.baselineCostPerInstall).isEqualByComparingTo(BigDecimal("3.33"))
        val lower = result.items.single { it.type == AppleAdsRecommendationType.LOWER_BID }
        assertThat(lower.keywordId).isEqualTo(1L)
        assertThat(lower.currentBid).isEqualByComparingTo(BigDecimal("1.45"))
        assertThat(lower.suggestedBid).isEqualByComparingTo(BigDecimal("1.23"))
        assertThat(lower.reason).contains("1.60 USD")
    }

    @Test
    fun `설치 대부분을 차지하는 키워드도 자기를 뺀 나머지와 비교해 입찰가를 낮추라고 한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 20, installs = 10, spend = "70.00"),
                keyword(id = 2L, taps = 10, installs = 9, spend = "30.00"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.baselineCostPerInstall).isEqualByComparingTo(BigDecimal("5.26"))
        val lower = result.items.single { it.type == AppleAdsRecommendationType.LOWER_BID }
        assertThat(lower.keywordId).isEqualTo(1L)
        assertThat(lower.reason).contains("3.33 USD")
    }

    @Test
    fun `설치 없이 탭 10회를 넘긴 키워드는 일시정지 전 단계로 입찰가를 낮추라고 한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 12, installs = 0, spend = "9.00", bid = "1.45"),
                keyword(id = 2L, taps = 9, installs = 0, spend = "3.00", bid = "1.45"),
                keyword(id = 3L, taps = 10, installs = 5, spend = "5.00", bid = "1.00"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.items).hasSize(1)
        assertThat(result.items[0].type).isEqualTo(AppleAdsRecommendationType.LOWER_BID)
        assertThat(result.items[0].keywordId).isEqualTo(1L)
        assertThat(result.items[0].suggestedBid).isEqualByComparingTo(BigDecimal("1.23"))
        assertThat(result.items[0].reason).contains("탭 12회")
    }

    @Test
    fun `다른 키워드보다 설치당 비용이 낮으면 애플 제안 안에서 입찰가를 올리라고 한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 10, installs = 5, spend = "5.00", bid = "1.00", suggestedBid = "1.10"),
                keyword(id = 2L, taps = 10, installs = 5, spend = "5.00", bid = "1.00", suggestedBid = "3.00"),
                keyword(id = 3L, taps = 10, installs = 5, spend = "5.00", bid = "1.00"),
                keyword(id = 4L, taps = 40, installs = 4, spend = "40.00", bid = "1.00"),
                keyword(id = 5L, taps = 10, installs = 5, spend = "5.00", bid = "1.45", suggestedBid = "1.20"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.baselineCostPerInstall).isEqualByComparingTo(BigDecimal("2.50"))
        val raises = result.items.filter {
            it.type == AppleAdsRecommendationType.RAISE_BID
        }.associateBy { it.keywordId }
        assertThat(raises.keys).containsExactlyInAnyOrder(1L, 2L, 3L, 5L)
        assertThat(raises.getValue(1L).suggestedBid).isEqualByComparingTo(BigDecimal("1.10"))
        assertThat(raises.getValue(2L).suggestedBid).isEqualByComparingTo(BigDecimal("1.15"))
        assertThat(raises.getValue(3L).suggestedBid).isEqualByComparingTo(BigDecimal("1.15"))
        assertThat(raises.getValue(1L).reason).contains("애플 제안 입찰가")
        assertThat(raises.getValue(3L).reason).doesNotContain("애플 제안 입찰가")
        assertThat(raises.getValue(5L).suggestedBid).isEqualByComparingTo(BigDecimal("1.67"))
        assertThat(raises.getValue(5L).reason).doesNotContain("애플 제안 입찰가")
    }

    @Test
    fun `설치가 하나도 없는 기간에는 입찰가 추천을 하지 않는다`() {
        // given
        given(keywords = listOf(keyword(id = 1L, taps = 10, installs = 0, spend = "5.00", bid = "1.00")))

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.items).isEmpty()
    }

    @Test
    fun `설치 없이 탭만 쌓인 Search Match 검색어는 제외 키워드로 추천한다`() {
        // given
        given(
            keywords = listOf(keyword(id = 1L, keyword = "동네친구", taps = 10, installs = 2, spend = "5.00")),
            searchTerms = listOf(
                searchTerm("디스코드", taps = 10, installs = 0, spend = "6.00"),
                searchTerm("라인", taps = 9, installs = 0, spend = "6.00"),
                searchTerm("동네 친구", taps = 10, installs = 0, spend = "6.00"),
                searchTerm("동네친구", taps = 10, installs = 0, spend = "6.00"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        val negatives = result.items.filter { it.type == AppleAdsRecommendationType.ADD_NEGATIVE_KEYWORD }
        assertThat(negatives.map { it.searchTerm }).containsExactlyInAnyOrder("디스코드", "동네 친구")
        assertThat(negatives[0].keywordId).isNull()
    }

    @Test
    fun `같은 광고그룹에서 키워드 매칭으로 설치가 난 검색어는 제외 키워드로 추천하지 않는다`() {
        // given
        given(
            keywords = emptyList(),
            searchTerms = listOf(
                searchTerm("동네 친구", taps = 10, installs = 0, spend = "6.00"),
                searchTerm("동네 친구", taps = 4, installs = 1, spend = "2.00", source = "TARGETED", keywordId = 1L),
                searchTerm("디스코드", taps = 10, installs = 0, spend = "6.00"),
                searchTerm(
                    "디스코드",
                    taps = 4,
                    installs = 3,
                    spend = "2.00",
                    source = "TARGETED",
                    keywordId = 2L,
                    adGroupId = OTHER_AD_GROUP_ID,
                ),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.items.map { it.type to it.searchTerm }).containsExactly(
            AppleAdsRecommendationType.ADD_NEGATIVE_KEYWORD to "디스코드",
        )
    }

    @Test
    fun `설치가 나온 Search Match 검색어는 광고그룹 입찰가로 키워드 추가를 추천한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 10, installs = 3, spend = "5.00", bid = "1.45"),
                keyword(id = 2L, taps = 10, installs = 3, spend = "5.00", bid = "1.20", adGroupId = OTHER_AD_GROUP_ID),
            ),
            searchTerms = listOf(
                searchTerm("소개팅 앱", taps = 5, installs = 2, spend = "3.00"),
                searchTerm("수다", taps = 5, installs = 1, spend = "3.00"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        val adds = result.items.filter { it.type == AppleAdsRecommendationType.ADD_KEYWORD }
        assertThat(adds).hasSize(1)
        assertThat(adds[0].searchTerm).isEqualTo("소개팅 앱")
        assertThat(adds[0].suggestedBid).isEqualByComparingTo(BigDecimal("1.45"))
        assertThat(adds[0].costPerInstall).isEqualByComparingTo(BigDecimal("1.50"))
    }

    @Test
    fun `광고그룹 입찰가를 알 수 없으면 키워드 추가를 추천하지 않는다`() {
        // given
        given(
            keywords = listOf(keyword(id = 1L, taps = 5, installs = 1, spend = "2.00", bid = null)),
            searchTerms = listOf(searchTerm("소개팅 앱", taps = 5, installs = 2, spend = "3.00")),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.items).isEmpty()
    }

    @Test
    fun `지워진 키워드는 추천하지 않고 이미 있는 키워드로도 치지 않는다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, keyword = "소개팅 앱", taps = 30, installs = 0, spend = "9.00", deleted = true),
                keyword(id = 2L, taps = 10, installs = 3, spend = "5.00", bid = "1.45"),
            ),
            searchTerms = listOf(searchTerm("소개팅 앱", taps = 5, installs = 2, spend = "3.00")),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.items.map { it.type }).containsExactly(AppleAdsRecommendationType.ADD_KEYWORD)
        assertThat(result.items[0].suggestedBid).isEqualByComparingTo(BigDecimal("1.45"))
    }

    @Test
    fun `추천은 유형 순서대로, 같은 유형 안에서는 지출 순으로 정렬한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 10, installs = 5, spend = "5.00", bid = "1.00"),
                keyword(id = 2L, taps = 20, installs = 0, spend = "3.00"),
                keyword(id = 3L, taps = 20, installs = 0, spend = "7.00"),
                keyword(id = 4L, taps = 10, installs = 2, spend = "8.00", bid = "1.00"),
            ),
            searchTerms = listOf(searchTerm("디스코드", taps = 10, installs = 0, spend = "6.00")),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.items.map { it.type }).containsExactly(
            AppleAdsRecommendationType.PAUSE_KEYWORD,
            AppleAdsRecommendationType.PAUSE_KEYWORD,
            AppleAdsRecommendationType.ADD_NEGATIVE_KEYWORD,
            AppleAdsRecommendationType.RAISE_BID,
        )
        assertThat(result.items[0].keywordId).isEqualTo(3L)
    }

    @Test
    fun `최근에 조치했거나 되돌린 키워드와 검색어는 다시 추천하지 않는다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 20, installs = 0, spend = "9.00"),
                keyword(id = 2L, taps = 20, installs = 0, spend = "9.00"),
            ),
            searchTerms = listOf(
                searchTerm("디스코드", taps = 10, installs = 0, spend = "6.00"),
                searchTerm("라인", taps = 10, installs = 0, spend = "6.00"),
            ),
            recentActions = listOf(
                action(type = AppleAdsActionType.PAUSE_KEYWORD, keywordId = 1L),
                action(type = AppleAdsActionType.ADD_NEGATIVE_KEYWORD, searchTerm = " 디스코드 "),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.items.map { it.keywordId ?: it.searchTerm }).containsExactly(2L, "라인")
        val cooldownSince = NOW.minus(AppleAdsRecommender.COOLDOWN)
        verify { actionRepository.findAllByCreatedAtAfterOrRevertedAtAfter(cooldownSince, cooldownSince) }
    }

    @Test
    fun `되돌리지 않은 검색어 조치는 쿨다운이 지나도 그 검색어를 다시 추천하지 않는다`() {
        // given
        given(
            keywords = emptyList(),
            searchTerms = listOf(
                searchTerm("디스코드", taps = 10, installs = 0, spend = "6.00"),
                searchTerm("소개팅 앱", taps = 12, installs = 2, spend = "4.00"),
                searchTerm("라인", taps = 10, installs = 0, spend = "6.00"),
            ),
            searchTermActions = listOf(
                action(type = AppleAdsActionType.ADD_NEGATIVE_KEYWORD, searchTerm = "디스코드"),
                action(type = AppleAdsActionType.ADD_KEYWORD, searchTerm = "소개팅 앱"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.items.map { it.searchTerm }).containsExactly("라인")
        verify { actionRepository.findAllByTypeInAndRevertedAtIsNull(AppleAdsRecommender.SEARCH_TERM_ACTION_TYPES) }
    }

    private fun given(
        keywords: List<AppleAdsKeywordSummaryRow>,
        searchTerms: List<AppleAdsSearchTermSummaryRow> = emptyList(),
        recentActions: List<AppleAdsAction> = emptyList(),
        searchTermActions: List<AppleAdsAction> = emptyList(),
    ) {
        every { summaryRepository.summarizeKeywords(START, END, null) } returns keywords
        every { summaryRepository.summarizeSearchTerms(START, END, null, null) } returns searchTerms
        every { actionRepository.findAllByCreatedAtAfterOrRevertedAtAfter(any(), any()) } returns recentActions
        every { actionRepository.findAllByTypeInAndRevertedAtIsNull(any()) } returns searchTermActions
    }

    private fun action(type: AppleAdsActionType, keywordId: Long? = null, searchTerm: String? = null) = AppleAdsAction(
        actorId = 1L,
        automatic = false,
        type = type,
        campaignId = CAMPAIGN_ID,
        adGroupId = AD_GROUP_ID,
        adGroupName = "Ad Group 1",
        keywordId = keywordId,
        keyword = null,
        matchType = null,
        searchTerm = searchTerm,
        negativeKeywordId = null,
        previousBid = null,
        newBid = null,
        currency = "USD",
        previousStatus = null,
        newStatus = null,
        reason = null,
    )

    private fun keyword(
        id: Long,
        taps: Long,
        installs: Long,
        spend: String,
        bid: String? = "1.45",
        suggestedBid: String? = null,
        status: String = "ACTIVE",
        keyword: String = "keyword $id",
        adGroupId: Long = AD_GROUP_ID,
        deleted: Boolean = false,
    ) = mockk<AppleAdsKeywordSummaryRow> {
        every { keywordId } returns id
        every { this@mockk.keyword } returns keyword
        every { matchType } returns "EXACT"
        every { keywordStatus } returns status
        every { this@mockk.deleted } returns deleted
        every { bidAmount } returns bid?.let { BigDecimal(it) }
        every { suggestedBidAmount } returns suggestedBid?.let { BigDecimal(it) }
        every { bidMin } returns null
        every { bidMax } returns null
        every { campaignId } returns CAMPAIGN_ID
        every { this@mockk.adGroupId } returns adGroupId
        every { adGroupName } returns "Ad Group 1"
        every { impressions } returns taps * 10
        every { this@mockk.taps } returns taps
        every { totalInstalls } returns installs
        every { tapInstalls } returns installs
        every { viewInstalls } returns 0
        every { totalNewDownloads } returns installs
        every { totalRedownloads } returns 0
        every { this@mockk.spend } returns BigDecimal(spend)
        every { currency } returns "USD"
    }

    private fun searchTerm(
        term: String,
        taps: Long,
        installs: Long,
        spend: String,
        source: String = "AUTO",
        keywordId: Long? = null,
        adGroupId: Long = AD_GROUP_ID,
    ) = mockk<AppleAdsSearchTermSummaryRow> {
        every { searchTerm } returns term
        every { searchTermSource } returns source
        every { countryOrRegion } returns "KR"
        every { this@mockk.keywordId } returns keywordId
        every { keyword } returns null
        every { matchType } returns null
        every { campaignId } returns CAMPAIGN_ID
        every { this@mockk.adGroupId } returns adGroupId
        every { adGroupName } returns "Ad Group 1"
        every { impressions } returns taps * 10
        every { this@mockk.taps } returns taps
        every { totalInstalls } returns installs
        every { tapInstalls } returns installs
        every { viewInstalls } returns 0
        every { totalNewDownloads } returns installs
        every { totalRedownloads } returns 0
        every { this@mockk.spend } returns BigDecimal(spend)
        every { currency } returns "USD"
    }

    companion object {

        private const val CAMPAIGN_ID = 1000L
        private const val AD_GROUP_ID = 10L
        private const val OTHER_AD_GROUP_ID = 11L

        private val NOW: Instant = Instant.parse("2026-09-06T12:00:00Z")
        private val START: LocalDate = LocalDate.of(2026, 8, 5)
        private val END: LocalDate = LocalDate.of(2026, 9, 3)
    }
}
