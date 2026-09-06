package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordSummaryRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendationType
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermSummaryRow
import com.blueoauld.server.domain.appleads.repository.AppleAdsSummaryRepository
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.LocalDate

class AppleAdsRecommenderTest {

    private val summaryRepository = mockk<AppleAdsSummaryRepository>()

    private val recommender = AppleAdsRecommender(summaryRepository)

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
    fun `기준보다 설치당 비용이 크게 높으면 입찰가를 낮추라고 한다`() {
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
    }

    @Test
    fun `기준보다 설치당 비용이 낮으면 애플 제안 안에서 입찰가를 올리라고 한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 10, installs = 5, spend = "5.00", bid = "1.00", suggestedBid = "1.10"),
                keyword(id = 2L, taps = 10, installs = 5, spend = "5.00", bid = "1.00", suggestedBid = "3.00"),
                keyword(id = 3L, taps = 10, installs = 5, spend = "5.00", bid = "1.00"),
                keyword(id = 4L, taps = 40, installs = 4, spend = "40.00", bid = "1.00"),
            ),
        )

        // when
        val result = recommender.recommend(START, END, null)

        // then
        assertThat(result.baselineCostPerInstall).isEqualByComparingTo(BigDecimal("2.89"))
        val raises = result.items.filter {
            it.type == AppleAdsRecommendationType.RAISE_BID
        }.associateBy { it.keywordId }
        assertThat(raises.keys).containsExactlyInAnyOrder(1L, 2L, 3L)
        assertThat(raises.getValue(1L).suggestedBid).isEqualByComparingTo(BigDecimal("1.10"))
        assertThat(raises.getValue(2L).suggestedBid).isEqualByComparingTo(BigDecimal("1.15"))
        assertThat(raises.getValue(3L).suggestedBid).isEqualByComparingTo(BigDecimal("1.15"))
        assertThat(raises.getValue(1L).reason).contains("애플 제안 입찰가")
        assertThat(raises.getValue(3L).reason).doesNotContain("애플 제안 입찰가")
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
    fun `추천은 유형 순서대로, 같은 유형 안에서는 지출 순으로 정렬한다`() {
        // given
        given(
            keywords = listOf(
                keyword(id = 1L, taps = 10, installs = 5, spend = "5.00", bid = "1.00"),
                keyword(id = 2L, taps = 20, installs = 0, spend = "3.00"),
                keyword(id = 3L, taps = 20, installs = 0, spend = "7.00"),
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

    private fun given(
        keywords: List<AppleAdsKeywordSummaryRow>,
        searchTerms: List<AppleAdsSearchTermSummaryRow> = emptyList(),
    ) {
        every { summaryRepository.summarizeKeywords(START, END, null) } returns keywords
        every { summaryRepository.summarizeSearchTerms(START, END, null, "AUTO") } returns searchTerms
    }

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
    ) = mockk<AppleAdsKeywordSummaryRow> {
        every { keywordId } returns id
        every { this@mockk.keyword } returns keyword
        every { matchType } returns "EXACT"
        every { keywordStatus } returns status
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

    private fun searchTerm(term: String, taps: Long, installs: Long, spend: String) =
        mockk<AppleAdsSearchTermSummaryRow> {
            every { searchTerm } returns term
            every { searchTermSource } returns "AUTO"
            every { countryOrRegion } returns "KR"
            every { keywordId } returns null
            every { keyword } returns null
            every { matchType } returns null
            every { campaignId } returns CAMPAIGN_ID
            every { adGroupId } returns AD_GROUP_ID
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

        private val START: LocalDate = LocalDate.of(2026, 8, 5)
        private val END: LocalDate = LocalDate.of(2026, 9, 3)
    }
}
