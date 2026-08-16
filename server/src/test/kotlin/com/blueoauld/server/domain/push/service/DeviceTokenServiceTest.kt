package com.blueoauld.server.domain.push.service

import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test

class DeviceTokenServiceTest {

    private val deviceTokenRepository = mockk<DeviceTokenRepository>(relaxed = true)

    private val deviceTokenService = DeviceTokenService(deviceTokenRepository)

    @Test
    fun `만료된 토큰을 지운다`() {
        // given
        val tokens = listOf(TOKEN)

        // when
        deviceTokenService.removeExpired(tokens)

        // then
        verify { deviceTokenRepository.deleteAllByTokenIn(tokens) }
    }

    @Test
    fun `만료된 토큰이 없으면 지우지 않는다`() {
        // given

        // when
        deviceTokenService.removeExpired(emptyList())

        // then
        verify(exactly = 0) { deviceTokenRepository.deleteAllByTokenIn(any()) }
    }

    companion object {

        private const val TOKEN = "ExponentPushToken[a]"
    }
}
