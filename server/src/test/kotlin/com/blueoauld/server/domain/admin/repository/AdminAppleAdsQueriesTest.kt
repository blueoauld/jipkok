package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.appleads.repository.AppleAdsKeywordDailyRepository
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
class AdminAppleAdsQueriesTest {

    @Autowired
    private lateinit var appleAdsAdminRepository: AppleAdsAdminRepository

    @Autowired
    private lateinit var keywordDailyRepository: AppleAdsKeywordDailyRepository

    @Test
    fun `적재 상태는 마지막 저장 시각과 가장 최근 리포트 날짜다`() {
        // given
        upsertKeyword(reportDate = REPORT_DATE, now = NOW)
        upsertKeyword(reportDate = NEXT_DATE, now = LATER)

        // when
        val status = appleAdsAdminRepository.findReportStatus()

        // then
        assertThat(status.lastSyncedAt).isAfterOrEqualTo(LATER)
        assertThat(status.latestReportDate).isAfterOrEqualTo(NEXT_DATE)
    }

    private fun upsertKeyword(reportDate: LocalDate, now: Instant) {
        keywordDailyRepository.upsert(
            reportDate = reportDate,
            campaignId = CAMPAIGN_ID,
            adGroupId = AD_GROUP_ID,
            adGroupName = "Ad Group 1",
            keywordId = KEYWORD_ID,
            keyword = "dating app",
            matchType = "EXACT",
            keywordStatus = "ACTIVE",
            deleted = false,
            bidAmount = BigDecimal("1.50"),
            suggestedBidAmount = null,
            bidMin = null,
            bidMax = null,
            currency = "USD",
            impressions = 10,
            taps = 1,
            totalInstalls = 1,
            tapInstalls = 1,
            viewInstalls = 0,
            totalNewDownloads = 1,
            totalRedownloads = 0,
            spend = BigDecimal("1.00"),
            now = now,
        )
    }

    companion object {

        private const val CAMPAIGN_ID = 900_000_101L
        private const val AD_GROUP_ID = 900_000_102L
        private const val KEYWORD_ID = 900_000_103L

        private val REPORT_DATE: LocalDate = LocalDate.of(2026, 9, 1)
        private val NEXT_DATE: LocalDate = LocalDate.of(2026, 9, 2)
        private val NOW: Instant = Instant.parse("2026-09-06T00:00:00Z")
        private val LATER: Instant = NOW.plusSeconds(3600)
    }
}
