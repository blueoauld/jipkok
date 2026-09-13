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

class AppleAdsSchedulerTest {

    private val reportSyncer = mockk<AppleAdsReportSyncer>()

    private val automationService = mockk<AppleAdsAutomationService>()

    private val scheduler = AppleAdsScheduler(reportSyncer, automationService, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `자동 조치가 보는 30일 창의 시작부터 어제까지 다시 받은 뒤 자동 조치를 돌린다`() {
        // given
        every { reportSyncer.sync(any(), any()) } returns mockk()
        every { automationService.run() } returns mockk()

        // when
        scheduler.runDaily()

        // then
        verify { reportSyncer.sync(LocalDate.of(2026, 8, 6), LocalDate.of(2026, 9, 6)) }
        verify { automationService.run() }
    }

    @Test
    fun `적재에 실패하면 자동 조치는 건너뛰고 스케줄러는 죽지 않는다`() {
        // given
        every { reportSyncer.sync(any(), any()) } throws BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)

        // when

        // then
        assertDoesNotThrow { scheduler.runDaily() }
        verify(exactly = 0) { automationService.run() }
    }

    @Test
    fun `자동 조치가 실패해도 스케줄러는 죽지 않는다`() {
        // given
        every { reportSyncer.sync(any(), any()) } returns mockk()
        every { automationService.run() } throws IllegalStateException("boom")

        // when

        // then
        assertDoesNotThrow { scheduler.runDaily() }
    }

    companion object {

        // UTC 6일 16시는 한국 7일 1시다.
        private val NOW: Instant = Instant.parse("2026-09-06T16:00:00Z")
    }
}
