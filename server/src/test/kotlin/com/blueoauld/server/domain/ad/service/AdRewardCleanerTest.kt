package com.blueoauld.server.domain.ad.service

import com.blueoauld.server.domain.ad.repository.AdRewardRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AdRewardCleanerTest {

    private val adRewardRepository = mockk<AdRewardRepository>()

    private val cleaner = AdRewardCleaner(adRewardRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `구십일 지난 광고 보상 기록을 지운다`() {
        // given
        every { adRewardRepository.deleteAllRewardedBefore(any()) } returns 3

        // when
        cleaner.cleanUp()

        // then
        verify { adRewardRepository.deleteAllRewardedBefore(TODAY.minus(AdRewardCleaner.RETENTION)) }
    }

    companion object {

        // UTC 5일 12시는 한국 5일 21시다.
        private val NOW: Instant = Instant.parse("2026-08-05T12:00:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 8, 5)
    }
}
