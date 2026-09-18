package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.ai.repository.AiRoomMemoryRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class AiReplyLogCleanerTest {

    private val aiReplyLogRepository = mockk<AiReplyLogRepository>()

    private val aiRoomMemoryRepository = mockk<AiRoomMemoryRepository>()

    private val cleaner = AiReplyLogCleaner(
        aiReplyLogRepository,
        aiRoomMemoryRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `구십일 지난 응답 로그와 방이 사라진 대화 기억을 지운다`() {
        // given
        every { aiReplyLogRepository.deleteAllByCreatedAtBefore(any()) } returns 4
        every { aiRoomMemoryRepository.deleteOrphans() } returns 1

        // when
        cleaner.cleanUp()

        // then
        verify { aiReplyLogRepository.deleteAllByCreatedAtBefore(NOW.minus(AiReplyLogCleaner.RETENTION)) }
        verify { aiRoomMemoryRepository.deleteOrphans() }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-18T12:00:00Z")
    }
}
