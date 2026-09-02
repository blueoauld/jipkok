package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.repository.AccessLogRepository
import com.blueoauld.server.domain.access.repository.AccessRewardRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AccessLogCleanerTest {

    private val accessLogRepository = mockk<AccessLogRepository>()

    private val accessRewardRepository = mockk<AccessRewardRepository>()

    private val cleaner = AccessLogCleaner(
        accessLogRepository,
        accessRewardRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `구십일 지난 접속 기록과 접속 보상을 함께 지운다`() {
        // given
        every { accessLogRepository.deleteAllCreatedBefore(any()) } returns 3
        every { accessRewardRepository.deleteAllAccessedBefore(any()) } returns 2

        // when
        cleaner.cleanUp()

        // then
        verify { accessLogRepository.deleteAllCreatedBefore(NOW.minus(AccessLogCleaner.RETENTION)) }
        verify { accessRewardRepository.deleteAllAccessedBefore(TODAY.minus(AccessLogCleaner.REWARD_RETENTION)) }
    }

    companion object {

        // UTC 5일 12시는 한국 5일 21시다.
        private val NOW: Instant = Instant.parse("2026-08-05T12:00:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 8, 5)
    }
}
