package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.repository.AppleAdsAdminRepository
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordSummaryRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermSummaryRow
import com.blueoauld.server.domain.appleads.repository.AppleAdsCampaignRepository
import com.blueoauld.server.domain.appleads.repository.AppleAdsSummaryRepository
import com.blueoauld.server.domain.appleads.service.AppleAdsRecommender
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.LocalDate

class AdminAppleAdsReportServiceTest {

    private val campaignRepository = mockk<AppleAdsCampaignRepository>()

    private val summaryRepository = mockk<AppleAdsSummaryRepository>()

    private val appleAdsAdminRepository = mockk<AppleAdsAdminRepository>()

    private val recommender = mockk<AppleAdsRecommender>()

    private val service = AdminAppleAdsReportService(
        campaignRepository,
        summaryRepository,
        appleAdsAdminRepository,
        recommender,
    )

    @Test
    fun `키워드 성과에 파생 지표와 합계를 붙인다`() {
        // given
        every { summaryRepository.summarizeKeywords(START, END, null) } returns listOf(
            keywordRow(keywordId = 1L, impressions = 200, taps = 10, installs = 4, spend = "12.345"),
            keywordRow(keywordId = 2L, impressions = 50, taps = 0, installs = 0, spend = "0.004"),
        )

        // when
        val response = service.findKeywords(START, END, null)

        // then
        val first = response.items[0].metrics
        assertThat(first.spend).isEqualByComparingTo(BigDecimal("12.35"))
        assertThat(first.tapThroughRate).isEqualTo(0.05)
        assertThat(first.costPerTap).isEqualByComparingTo(BigDecimal("1.23"))
        assertThat(first.costPerInstall).isEqualByComparingTo(BigDecimal("3.09"))
        assertThat(first.conversionRate).isEqualTo(0.4)

        val second = response.items[1].metrics
        assertThat(second.tapThroughRate).isEqualTo(0.0)
        assertThat(second.costPerTap).isNull()
        assertThat(second.costPerInstall).isNull()
        assertThat(second.conversionRate).isNull()

        assertThat(response.total.impressions).isEqualTo(250)
        assertThat(response.total.taps).isEqualTo(10)
        assertThat(response.total.totalInstalls).isEqualTo(4)
        assertThat(response.total.spend).isEqualByComparingTo(BigDecimal("12.35"))
        assertThat(response.items[1].metrics.spend).isEqualByComparingTo(BigDecimal("0.00"))
        assertThat(response.total.currency).isEqualTo("USD")
        assertThat(response.total.tapThroughRate).isEqualTo(0.04)
    }

    @Test
    fun `검색어 성과는 출처 필터를 그대로 넘긴다`() {
        // given
        every { summaryRepository.summarizeSearchTerms(START, END, CAMPAIGN_ID, "AUTO") } returns listOf(
            searchTermRow(searchTerm = "소개팅 앱", impressions = 30, taps = 3, installs = 1, spend = "2.00"),
        )

        // when
        val response = service.findSearchTerms(START, END, CAMPAIGN_ID, "AUTO")

        // then
        assertThat(response.items).hasSize(1)
        assertThat(response.items[0].searchTerm).isEqualTo("소개팅 앱")
        assertThat(response.items[0].keywordId).isNull()
        assertThat(response.items[0].metrics.costPerInstall).isEqualByComparingTo(BigDecimal("2.00"))
        assertThat(response.total.totalInstalls).isEqualTo(1)
    }

    @Test
    fun `시작일이 종료일보다 늦으면 조회하지 않는다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) { service.findKeywords(END, START, null) }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REQUEST)
    }

    private fun keywordRow(keywordId: Long, impressions: Long, taps: Long, installs: Long, spend: String) =
        mockk<AppleAdsKeywordSummaryRow> {
            every { this@mockk.keywordId } returns keywordId
            every { keyword } returns "keyword $keywordId"
            every { matchType } returns "EXACT"
            every { keywordStatus } returns "ACTIVE"
            every { deleted } returns false
            every { bidAmount } returns BigDecimal("1.45")
            every { suggestedBidAmount } returns null
            every { bidMin } returns null
            every { bidMax } returns null
            every { campaignId } returns CAMPAIGN_ID
            every { adGroupId } returns AD_GROUP_ID
            every { adGroupName } returns "Ad Group 1"
            every { this@mockk.impressions } returns impressions
            every { this@mockk.taps } returns taps
            every { totalInstalls } returns installs
            every { tapInstalls } returns installs
            every { viewInstalls } returns 0
            every { totalNewDownloads } returns installs
            every { totalRedownloads } returns 0
            every { this@mockk.spend } returns BigDecimal(spend)
            every { currency } returns "USD"
        }

    private fun searchTermRow(searchTerm: String, impressions: Long, taps: Long, installs: Long, spend: String) =
        mockk<AppleAdsSearchTermSummaryRow> {
            every { this@mockk.searchTerm } returns searchTerm
            every { searchTermSource } returns "AUTO"
            every { countryOrRegion } returns "KR"
            every { keywordId } returns null
            every { keyword } returns null
            every { matchType } returns null
            every { campaignId } returns CAMPAIGN_ID
            every { adGroupId } returns AD_GROUP_ID
            every { adGroupName } returns "Ad Group 1"
            every { this@mockk.impressions } returns impressions
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

        private val START: LocalDate = LocalDate.of(2026, 9, 1)
        private val END: LocalDate = LocalDate.of(2026, 9, 5)
    }
}
