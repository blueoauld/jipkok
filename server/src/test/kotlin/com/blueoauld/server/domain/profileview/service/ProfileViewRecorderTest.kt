package com.blueoauld.server.domain.profileview.service

import com.blueoauld.server.domain.profileview.event.ProfileViewedEvent
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow

class ProfileViewRecorderTest {

    private val profileViewService = mockk<ProfileViewService>(relaxed = true)

    private val recorder = ProfileViewRecorder(profileViewService)

    @Test
    fun `이벤트를 받으면 조회를 기록한다`() {
        // when
        recorder.record(ProfileViewedEvent(1L, 2L))

        // then
        verify { profileViewService.record(1L, 2L) }
    }

    @Test
    fun `기록에 실패해도 예외를 밖으로 던지지 않는다`() {
        // given
        every { profileViewService.record(any(), any()) } throws IllegalStateException("db down")

        // when, then
        assertDoesNotThrow { recorder.record(ProfileViewedEvent(1L, 2L)) }
    }
}
