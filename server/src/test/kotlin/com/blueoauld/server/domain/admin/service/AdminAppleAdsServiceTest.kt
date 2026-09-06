package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsOrg
import com.blueoauld.server.domain.appleads.service.AppleAdsClient
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AdminAppleAdsServiceTest {

    private val appleAdsClient = mockk<AppleAdsClient>()

    private val adminAppleAdsService = AdminAppleAdsService(appleAdsClient)

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
}
