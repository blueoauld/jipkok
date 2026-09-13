package com.blueoauld.server.global.security

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.http.HttpHeaders
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.MessageBuilder

class StompAuthenticationInterceptorTest {

    private val jwtProvider = mockk<JwtProvider>()
    private val channel = mockk<MessageChannel>()

    private val interceptor = StompAuthenticationInterceptor(jwtProvider)

    @Test
    fun `CONNECT에 올바른 토큰이 있으면 세션 사용자를 세운다`() {
        // given
        every { jwtProvider.parseAccessToken(TOKEN) } returns JwtPayload(MEMBER_ID, ROLE)
        val accessor = connect("Bearer $TOKEN")

        // when
        interceptor.preSend(accessor.toMessage(), channel)

        // then
        assertThat(accessor.user?.name).isEqualTo(MEMBER_ID.toString())
    }

    @Test
    fun `CONNECT 토큰이 유효하지 않으면 UNAUTHORIZED로 막는다`() {
        // given
        every { jwtProvider.parseAccessToken(TOKEN) } returns null
        val message = connect("Bearer $TOKEN").toMessage()

        // when, then
        assertThatThrownBy { interceptor.preSend(message, channel) }
            .isInstanceOf(BusinessException::class.java)
            .extracting { (it as BusinessException).errorCode }
            .isEqualTo(ErrorCode.UNAUTHORIZED)
    }

    @Test
    fun `CONNECT에 Authorization 헤더가 없으면 UNAUTHORIZED로 막는다`() {
        // given
        val message = StompHeaderAccessor.create(StompCommand.CONNECT).toMessage()

        // when, then
        assertThatThrownBy { interceptor.preSend(message, channel) }
            .isInstanceOf(BusinessException::class.java)
        verify(exactly = 0) { jwtProvider.parseAccessToken(any()) }
    }

    @Test
    fun `클라이언트가 보내는 SEND는 막는다`() {
        // given
        val message = StompHeaderAccessor.create(StompCommand.SEND).toMessage()

        // when, then
        assertThatThrownBy { interceptor.preSend(message, channel) }
            .isInstanceOf(BusinessException::class.java)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN)
    }

    @Test
    fun `개인 큐 구독은 그대로 통과시킨다`() {
        // given
        val message = StompHeaderAccessor.create(StompCommand.SUBSCRIBE)
            .apply { destination = "/user/queue/chat" }
            .toMessage()

        // when
        val result = interceptor.preSend(message, channel)

        // then
        assertThat(result).isSameAs(message)
    }

    @Test
    fun `개인 큐가 아닌 목적지를 구독하면 막는다`() {
        // given
        val message = StompHeaderAccessor.create(StompCommand.SUBSCRIBE)
            .apply { destination = "/queue/**" }
            .toMessage()

        // when, then
        assertThatThrownBy { interceptor.preSend(message, channel) }
            .isInstanceOf(BusinessException::class.java)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN)
    }

    @Test
    fun `목적지 없는 구독은 막는다`() {
        // given
        val message = StompHeaderAccessor.create(StompCommand.SUBSCRIBE).toMessage()

        // when, then
        assertThatThrownBy { interceptor.preSend(message, channel) }
            .isInstanceOf(BusinessException::class.java)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN)
    }

    @Test
    fun `CONNECT, SUBSCRIBE, SEND가 아닌 명령은 토큰을 보지 않고 그대로 통과시킨다`() {
        // given
        val accessor = StompHeaderAccessor.create(StompCommand.UNSUBSCRIBE).apply {
            setNativeHeader(HttpHeaders.AUTHORIZATION, "Bearer $TOKEN")
        }
        val message = accessor.toMessage()

        // when
        val result = interceptor.preSend(message, channel)

        // then
        assertThat(result).isSameAs(message)
        verify(exactly = 0) { jwtProvider.parseAccessToken(any()) }
    }

    private fun connect(authorization: String) = StompHeaderAccessor.create(StompCommand.CONNECT).apply {
        setLeaveMutable(true)
        setNativeHeader(HttpHeaders.AUTHORIZATION, authorization)
    }

    private fun StompHeaderAccessor.toMessage(): Message<ByteArray> = MessageBuilder.createMessage(
        ByteArray(0),
        messageHeaders,
    )

    companion object {

        private const val TOKEN = "token"
        private const val MEMBER_ID = 7L
        private const val ROLE = "MEMBER"
    }
}
