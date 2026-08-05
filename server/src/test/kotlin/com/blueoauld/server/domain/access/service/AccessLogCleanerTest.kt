package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.repository.AccessLogRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class AccessLogCleanerTest {

    private val accessLogRepository = mockk<AccessLogRepository>()

    private val cleaner = AccessLogCleaner(accessLogRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `구십일 지난 접속 기록을 지운다`() {
        // given
        every { accessLogRepository.deleteAllCreatedBefore(any()) } returns 3

        // when
        cleaner.cleanUp()

        // then
        verify { accessLogRepository.deleteAllCreatedBefore(NOW.minus(AccessLogCleaner.RETENTION)) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-05T12:00:00Z")
    }
}
