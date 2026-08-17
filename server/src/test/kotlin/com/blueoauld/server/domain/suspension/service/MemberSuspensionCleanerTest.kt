package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class MemberSuspensionCleanerTest {

    private val memberSuspensionRepository = mockk<MemberSuspensionRepository>(relaxed = true)

    private val cleaner = MemberSuspensionCleaner(memberSuspensionRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `보관 기간이 지난 끝난 정지를 지운다`() {
        // given
        every { memberSuspensionRepository.findIdsExpiredBefore(any()) } returns IDS

        // when
        cleaner.cleanUpEndedSuspensions()

        // then
        verify { memberSuspensionRepository.findIdsExpiredBefore(NOW.minus(MemberSuspensionCleaner.RETENTION)) }
        verify { memberSuspensionRepository.deleteAllByIdIn(IDS) }
    }

    @Test
    fun `지울 정지가 없으면 아무것도 하지 않는다`() {
        // given
        every { memberSuspensionRepository.findIdsExpiredBefore(any()) } returns emptyList()

        // when
        cleaner.cleanUpEndedSuspensions()

        // then
        verify(exactly = 0) { memberSuspensionRepository.deleteAllByIdIn(any()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")

        private val IDS = listOf(10L, 11L)
    }
}
