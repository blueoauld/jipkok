package com.blueoauld.server.domain.push.service

import com.blueoauld.server.global.push.ExpoPushClient
import com.blueoauld.server.global.push.ExpoPushMessage
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.user.SimpUserRegistry

class PushServiceTest {

    private val deviceTokenService = mockk<DeviceTokenService>(relaxed = true)

    private val expoPushClient = mockk<ExpoPushClient>(relaxed = true)

    private val simpUserRegistry = mockk<SimpUserRegistry>(relaxed = true)

    private val pushService = PushService(deviceTokenService, expoPushClient, simpUserRegistry)

    @BeforeEach
    fun setUp() {
        every { deviceTokenService.findTokens(MEMBER_ID) } returns listOf(TOKEN, OTHER_TOKEN)
        every { expoPushClient.send(any()) } returns emptyList()
    }

    @Test
    fun `회원의 모든 기기로 보낸다`() {
        // given
        val messages = slot<List<ExpoPushMessage>>()

        // when
        pushService.send(MEMBER_ID, TITLE, BODY)

        // then
        verify { expoPushClient.send(capture(messages)) }
        assertThat(messages.captured.map { it.to }).containsExactly(TOKEN, OTHER_TOKEN)
        assertThat(messages.captured.first().title).isEqualTo(TITLE)
        assertThat(messages.captured.first().body).isEqualTo(BODY)
    }

    @Test
    fun `뱃지 수를 실어 보낸다`() {
        // given
        val messages = slot<List<ExpoPushMessage>>()

        // when
        pushService.send(MEMBER_ID, TITLE, BODY, badge = BADGE)

        // then
        verify { expoPushClient.send(capture(messages)) }
        assertThat(messages.captured).allMatch { it.badge == BADGE }
    }

    @Test
    fun `만료된 토큰은 지운다`() {
        // given
        every { expoPushClient.send(any()) } returns listOf(TOKEN)

        // when
        pushService.send(MEMBER_ID, TITLE, BODY)

        // then
        verify { deviceTokenService.removeExpired(listOf(TOKEN)) }
    }

    @Test
    fun `보낼 기기가 없으면 지우지 않는다`() {
        // given
        every { deviceTokenService.findTokens(MEMBER_ID) } returns emptyList()

        // when
        pushService.send(MEMBER_ID, TITLE, BODY)

        // then
        verify(exactly = 0) { deviceTokenService.removeExpired(match { it.isNotEmpty() }) }
    }

    @Test
    fun `묶음 발송은 이전 알림을 대체하도록 키를 실어 보낸다`() {
        // given
        val messages = slot<List<ExpoPushMessage>>()
        every { deviceTokenService.findTokens(listOf(MEMBER_ID)) } returns listOf(TOKEN)

        // when
        pushService.sendAll(listOf(MEMBER_ID), TITLE, BODY, collapseKey = COLLAPSE_KEY)

        // then
        verify { expoPushClient.send(capture(messages)) }
        assertThat(messages.captured.first().collapseId).isEqualTo(COLLAPSE_KEY)
        assertThat(messages.captured.first().tag).isEqualTo(COLLAPSE_KEY)
    }

    @Test
    fun `소켓에 붙어 있으면 접속 중으로 본다`() {
        // given
        every { simpUserRegistry.getUser(MEMBER_ID.toString()) } returns mockk()

        // when, then
        assertThat(pushService.isConnected(MEMBER_ID)).isTrue()
    }

    @Test
    fun `소켓에 없으면 접속 중이 아니다`() {
        // given
        every { simpUserRegistry.getUser(any()) } returns null

        // when, then
        assertThat(pushService.isConnected(MEMBER_ID)).isFalse()
    }

    companion object {

        private const val MEMBER_ID = 1L

        private const val TOKEN = "ExponentPushToken[a]"
        private const val OTHER_TOKEN = "ExponentPushToken[b]"

        private const val TITLE = "홍길동"
        private const val BODY = "안녕하세요."

        private const val COLLAPSE_KEY = "feed"

        private const val BADGE = 3
    }
}
