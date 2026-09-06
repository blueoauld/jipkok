package com.blueoauld.server.domain.appleads.repository

import com.blueoauld.server.TestcontainersConfiguration
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

    private fun upsertKeyword(impressions: Long, spend: BigDecimal, now: Instant) {
        keywordDailyRepository.upsert(
            reportDate = REPORT_DATE,
            campaignId = CAMPAIGN_ID,
            adGroupId = AD_GROUP_ID,
            adGroupName = "Ad Group 1",
            keywordId = KEYWORD_ID,
            keyword = "dating app",
            matchType = "EXACT",
            keywordStatus = "ACTIVE",
            bidAmount = BigDecimal("1.50"),
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

    private fun upsertSearchTerm(keywordId: Long?, impressions: Long, now: Instant) {
        searchTermDailyRepository.upsert(
            reportDate = REPORT_DATE,
            campaignId = CAMPAIGN_ID,
            adGroupId = AD_GROUP_ID,
            adGroupName = "Ad Group 1",
            keywordId = keywordId,
            keyword = keywordId?.let { "dating app" },
            matchType = keywordId?.let { "EXACT" },
            searchTerm = SEARCH_TERM,
            searchTermSource = "AUTO",
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
        private const val SEARCH_TERM = "소개팅 앱"

        private val REPORT_DATE: LocalDate = LocalDate.of(2026, 9, 1)
        private val NOW: Instant = Instant.parse("2026-09-06T00:00:00Z")
        private val LATER: Instant = NOW.plusSeconds(3600)
    }
}
