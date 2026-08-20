package com.blueoauld.server.domain.point.service

import com.blueoauld.server.domain.access.repository.AccessRewardRepository
import com.blueoauld.server.domain.ad.repository.AdRewardRepository
import com.blueoauld.server.domain.attendance.repository.AttendanceRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class RewardHistoryCleanerTest {

    private val attendanceRepository = mockk<AttendanceRepository>()

    private val accessRewardRepository = mockk<AccessRewardRepository>()

    private val adRewardRepository = mockk<AdRewardRepository>()

    private val cleaner = RewardHistoryCleaner(
        attendanceRepository,
        accessRewardRepository,
        adRewardRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `구십일 지난 보상 기록을 세 테이블에서 지운다`() {
        // given
        every { attendanceRepository.deleteAllAttendedBefore(THRESHOLD) } returns 1
        every { accessRewardRepository.deleteAllAccessedBefore(THRESHOLD) } returns 2
        every { adRewardRepository.deleteAllRewardedBefore(THRESHOLD) } returns 3

        // when
        cleaner.cleanUp()

        // then
        verify { attendanceRepository.deleteAllAttendedBefore(THRESHOLD) }
        verify { accessRewardRepository.deleteAllAccessedBefore(THRESHOLD) }
        verify { adRewardRepository.deleteAllRewardedBefore(THRESHOLD) }
    }

    companion object {

        // UTC 5일 12시는 한국 5일 21시다.
        private val NOW: Instant = Instant.parse("2026-08-05T12:00:00Z")
        private val THRESHOLD: LocalDate = LocalDate.of(2026, 8, 5).minus(RewardHistoryCleaner.RETENTION)
    }
}
