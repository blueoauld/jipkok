package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg
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
    fun `조직 목록을 응답으로 옮긴다`() {
        // given
        every { appleAdsClient.findOrgs() } returns listOf(
            AppleAdsOrg(
                orgId = 123456L,
                orgName = "Jipkok",
                currency = "KRW",
                timeZone = "Asia/Seoul",
                roleNames = listOf("API Account Manager"),
            ),
        )

        // when
        val orgs = adminAppleAdsService.findOrgs()

        // then
        assertThat(orgs).hasSize(1)
        assertThat(orgs[0].orgId).isEqualTo(123456L)
        assertThat(orgs[0].orgName).isEqualTo("Jipkok")
        assertThat(orgs[0].currency).isEqualTo("KRW")
        assertThat(orgs[0].timeZone).isEqualTo("Asia/Seoul")
        assertThat(orgs[0].roleNames).containsExactly("API Account Manager")
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
