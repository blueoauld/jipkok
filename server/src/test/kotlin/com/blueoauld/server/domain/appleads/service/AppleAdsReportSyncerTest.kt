package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsCampaignInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsDailyMetrics
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordDailyRow
import com.blueoauld.server.domain.appleads.dto.AppleAdsSearchTermDailyRow
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AppleAdsReportSyncerTest {

    private val appleAdsClient = mockk<AppleAdsClient>()

    private val reportStore = mockk<AppleAdsReportStore>()

    private val syncer = AppleAdsReportSyncer(appleAdsClient, reportStore, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `캠페인마다 키워드와 검색어 리포트를 받아 저장한다`() {
        // given
        every { appleAdsClient.findCampaigns() } returns listOf(CAMPAIGN, OTHER_CAMPAIGN)
        every { appleAdsClient.findKeywordDailyRows(CAMPAIGN.id, START, END) } returns listOf(KEYWORD_ROW, KEYWORD_ROW)
        every { appleAdsClient.findKeywordDailyRows(OTHER_CAMPAIGN.id, START, END) } returns emptyList()
        every { appleAdsClient.findSearchTermDailyRows(CAMPAIGN.id, START, END) } returns listOf(SEARCH_TERM_ROW)
        every { appleAdsClient.findSearchTermDailyRows(OTHER_CAMPAIGN.id, START, END) } returns emptyList()
        justRun { reportStore.saveCampaigns(any()) }
        justRun { reportStore.saveKeywordRows(any(), any()) }
        justRun { reportStore.saveSearchTermRows(any(), any()) }

        // when
        val result = syncer.sync(START, END)

        // then
        assertThat(result.campaigns).isEqualTo(2)
        assertThat(result.keywordRows).isEqualTo(2)
        assertThat(result.searchTermRows).isEqualTo(1)
        verify { reportStore.saveCampaigns(listOf(CAMPAIGN, OTHER_CAMPAIGN)) }
        verify { reportStore.saveKeywordRows(CAMPAIGN.id, listOf(KEYWORD_ROW, KEYWORD_ROW)) }
        verify { reportStore.saveSearchTermRows(CAMPAIGN.id, listOf(SEARCH_TERM_ROW)) }
        verify { reportStore.saveKeywordRows(OTHER_CAMPAIGN.id, emptyList()) }
    }

    @Test
    fun `시작일이 종료일보다 늦으면 받지 않는다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) { syncer.sync(END, START) }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_APPLE_ADS_REPORT_RANGE)
    }

    @Test
    fun `기간이 90일을 넘으면 받지 않는다`() {
        // given
        val start = TODAY.minusDays(91)

        // when
        val exception = assertThrows(BusinessException::class.java) { syncer.sync(start, TODAY) }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_APPLE_ADS_REPORT_RANGE)
    }

    @Test
    fun `종료일이 미래면 받지 않는다`() {
        // given
        val tomorrow = TODAY.plusDays(1)

        // when
        val exception = assertThrows(BusinessException::class.java) { syncer.sync(TODAY, tomorrow) }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_APPLE_ADS_REPORT_RANGE)
    }

    companion object {

        // UTC 6일 12시는 한국 6일 21시다.
        private val NOW: Instant = Instant.parse("2026-09-06T12:00:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 9, 6)
        private val START: LocalDate = LocalDate.of(2026, 9, 1)
        private val END: LocalDate = LocalDate.of(2026, 9, 5)

        private val CAMPAIGN = AppleAdsCampaignInfo(id = 1000L, name = "Jipkok KR", status = "ENABLED", deleted = false)
        private val OTHER_CAMPAIGN = AppleAdsCampaignInfo(id = 1001L, name = "Old", status = "PAUSED", deleted = true)

        private val METRICS = AppleAdsDailyMetrics(
            date = START,
            impressions = 10,
            taps = 2,
            totalInstalls = 1,
            tapInstalls = 1,
            viewInstalls = 0,
            totalNewDownloads = 1,
            totalRedownloads = 0,
            spend = BigDecimal("1.20"),
            currency = "USD",
        )

        private val KEYWORD_ROW = AppleAdsKeywordDailyRow(
            keywordId = 1L,
            keyword = "dating app",
            matchType = "EXACT",
            keywordStatus = "ACTIVE",
            bidAmount = BigDecimal("1.50"),
            suggestedBidAmount = BigDecimal("2.40"),
            bidMin = BigDecimal("1.00"),
            bidMax = BigDecimal("3.00"),
            adGroupId = 10L,
            adGroupName = "Ad Group 1",
            metrics = METRICS,
        )

        private val SEARCH_TERM_ROW = AppleAdsSearchTermDailyRow(
            searchTerm = "소개팅 앱",
            searchTermSource = "AUTO",
            countryOrRegion = "KR",
            keywordId = null,
            keyword = null,
            matchType = null,
            adGroupId = 10L,
            adGroupName = "Ad Group 1",
            metrics = METRICS,
        )
    }
}
