package com.blueoauld.server.domain.attendance.service

import com.blueoauld.server.domain.attendance.repository.AttendanceRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AttendanceCleanerTest {

    private val attendanceRepository = mockk<AttendanceRepository>()

    private val cleaner = AttendanceCleaner(attendanceRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `구십일 지난 출석 기록을 지운다`() {
        // given
        every { attendanceRepository.deleteAllAttendedBefore(any()) } returns 3

        // when
        cleaner.cleanUp()

        // then
        verify { attendanceRepository.deleteAllAttendedBefore(TODAY.minus(AttendanceCleaner.RETENTION)) }
    }

    companion object {

        // UTC 5일 12시는 한국 5일 21시다.
        private val NOW: Instant = Instant.parse("2026-08-05T12:00:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 8, 5)
    }
}
