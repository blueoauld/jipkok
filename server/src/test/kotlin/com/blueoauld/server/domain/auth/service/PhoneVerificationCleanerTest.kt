package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.repository.PhoneVerificationRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class PhoneVerificationCleanerTest {

    private val phoneVerificationRepository = mockk<PhoneVerificationRepository>()

    private val cleaner = PhoneVerificationCleaner(phoneVerificationRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `구십일 지난 인증 번호 기록을 지운다`() {
        // given
        every { phoneVerificationRepository.deleteAllIssuedBefore(any()) } returns 3

        // when
        cleaner.cleanUp()

        // then
        verify {
            phoneVerificationRepository.deleteAllIssuedBefore(NOW.minus(PhoneVerificationCleaner.RETENTION))
        }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-05T12:00:00Z")
    }
}
