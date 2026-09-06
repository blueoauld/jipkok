package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AppleAdsReportSchedulerTest {

    private val reportSyncer = mockk<AppleAdsReportSyncer>()

    private val scheduler = AppleAdsReportScheduler(reportSyncer, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `최근 일주일을 오늘까지 다시 받는다`() {
        // given
        every { reportSyncer.sync(any(), any()) } returns mockk()

        // when
        scheduler.syncRecent()

        // then
        verify { reportSyncer.sync(TODAY.minus(AppleAdsReportScheduler.SYNC_WINDOW), TODAY) }
    }

    @Test
    fun `적재에 실패해도 스케줄러는 죽지 않는다`() {
        // given
        every { reportSyncer.sync(any(), any()) } throws BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)

        // when

        // then
        assertDoesNotThrow { scheduler.syncRecent() }
    }

    companion object {

        // UTC 6일 16시는 한국 7일 1시다.
        private val NOW: Instant = Instant.parse("2026-09-06T16:00:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 9, 7)
    }
}
