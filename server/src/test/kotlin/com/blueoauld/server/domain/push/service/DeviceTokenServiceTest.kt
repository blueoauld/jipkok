package com.blueoauld.server.domain.push.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.service.MemberService
import com.blueoauld.server.domain.push.dto.request.RegisterDeviceTokenRequest
import com.blueoauld.server.domain.push.entity.DeviceToken
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.*

class DeviceTokenServiceTest {

    private val deviceTokenRepository = mockk<DeviceTokenRepository>(relaxed = true)

    private val memberService = mockk<MemberService>(relaxed = true)

    private val deviceTokenService = DeviceTokenService(deviceTokenRepository, memberService)

    @Test
    fun `처음 보는 토큰은 새로 저장한다`() {
        // given
        every { deviceTokenRepository.findByToken(TOKEN) } returns null
        every { deviceTokenRepository.save(any()) } answers { firstArg() }
        val saved = slot<DeviceToken>()

        // when
        deviceTokenService.register(MEMBER_ID, RegisterDeviceTokenRequest(TOKEN, DevicePlatform.IOS))

        // then
        verify { deviceTokenRepository.save(capture(saved)) }
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
        assertThat(saved.captured.token).isEqualTo(TOKEN)
    }

    @Test
    fun `언어를 보내면 회원의 언어를 바꾼다`() {
        // when
        deviceTokenService.register(
            MEMBER_ID,
            RegisterDeviceTokenRequest(TOKEN, DevicePlatform.IOS, MemberLocale.JA),
        )

        // then
        verify { memberService.updateLocale(MEMBER_ID, MemberLocale.JA) }
    }

    @Test
    fun `언어를 보내지 않으면 저장된 값을 그대로 둔다`() {
        // when
        deviceTokenService.register(MEMBER_ID, RegisterDeviceTokenRequest(TOKEN, DevicePlatform.IOS))

        // then
        verify(exactly = 0) { memberService.updateLocale(any(), any()) }
    }

    @Test
    fun `이미 있는 토큰은 새 회원에게 넘긴다`() {
        // given
        val token = DeviceToken(OTHER_MEMBER_ID, TOKEN, DevicePlatform.ANDROID)
        every { deviceTokenRepository.findByToken(TOKEN) } returns token

        // when
        deviceTokenService.register(MEMBER_ID, RegisterDeviceTokenRequest(TOKEN, DevicePlatform.IOS))

        // then
        verify(exactly = 0) { deviceTokenRepository.save(any()) }
        assertThat(token.memberId).isEqualTo(MEMBER_ID)
        assertThat(token.platform).isEqualTo(DevicePlatform.IOS)
    }

    @Test
    fun `회원의 기기 토큰을 모두 지운다`() {
        // when
        deviceTokenService.removeAll(MEMBER_ID)

        // then
        verify { deviceTokenRepository.deleteAllByMemberId(MEMBER_ID) }
    }

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
        // when
        deviceTokenService.removeExpired(emptyList())

        // then
        verify(exactly = 0) { deviceTokenRepository.deleteAllByTokenIn(any()) }
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val OTHER_MEMBER_ID = 2L

        private const val TOKEN = "ExponentPushToken[a]"
    }
}
