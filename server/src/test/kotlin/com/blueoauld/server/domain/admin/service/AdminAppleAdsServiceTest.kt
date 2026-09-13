package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsAdAccount
import com.blueoauld.server.domain.appleads.dto.AppleAdsSyncResult
import com.blueoauld.server.domain.appleads.service.AppleAdsClient
import com.blueoauld.server.domain.appleads.service.AppleAdsReportSyncer
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.LocalDate

class AdminAppleAdsServiceTest {

    private val appleAdsClient = mockk<AppleAdsClient>()

    private val reportSyncer = mockk<AppleAdsReportSyncer>()

    private val adminAppleAdsService = AdminAppleAdsService(appleAdsClient, reportSyncer)

    @Test
    fun `광고 계정 목록을 응답으로 옮긴다`() {
        // given
        every { appleAdsClient.findAdAccounts() } returns listOf(
            AppleAdsAdAccount(
                adAccountId = 654321L,
                name = "Jipkok",
                orgId = 123456L,
                currency = "USD",
                timeZone = "Asia/Seoul",
                roleNames = listOf("API Campaign Manager"),
            ),
        )

        // when
        val adAccounts = adminAppleAdsService.findAdAccounts()

        // then
        assertThat(adAccounts).hasSize(1)
        assertThat(adAccounts[0].adAccountId).isEqualTo(654321L)
        assertThat(adAccounts[0].name).isEqualTo("Jipkok")
        assertThat(adAccounts[0].orgId).isEqualTo(123456L)
        assertThat(adAccounts[0].currency).isEqualTo("USD")
        assertThat(adAccounts[0].timeZone).isEqualTo("Asia/Seoul")
        assertThat(adAccounts[0].roleNames).containsExactly("API Campaign Manager")
    }

    @Test
    fun `적재 결과를 응답으로 옮긴다`() {
        // given
        val start = LocalDate.of(2026, 9, 1)
        val end = LocalDate.of(2026, 9, 5)
        every { reportSyncer.sync(start, end) } returns
            AppleAdsSyncResult(campaigns = 2, keywordRows = 40, searchTermRows = 15)

        // when
        val response = adminAppleAdsService.syncReports(start, end)

        // then
        assertThat(response.campaigns).isEqualTo(2)
        assertThat(response.keywordRows).isEqualTo(40)
        assertThat(response.searchTermRows).isEqualTo(15)
    }
}
