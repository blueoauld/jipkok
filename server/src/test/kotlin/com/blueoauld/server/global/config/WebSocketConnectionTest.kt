package com.blueoauld.server.global.config

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.global.security.JwtProvider
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import org.springframework.messaging.converter.StringMessageConverter
import org.springframework.messaging.simp.stomp.StompHeaders
import org.springframework.messaging.simp.stomp.StompSession
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter
import org.springframework.web.socket.client.standard.StandardWebSocketClient
import org.springframework.web.socket.messaging.WebSocketStompClient
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit

@Import(TestcontainersConfiguration::class)
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = ["spring.jpa.hibernate.ddl-auto=none"],
)
class WebSocketConnectionTest {

    @LocalServerPort
    private var port: Int = 0

    @Autowired
    private lateinit var jwtProvider: JwtProvider

    @Test
    fun `액세스 토큰을 주면 연결된다`() {
        // given
        val headers = StompHeaders().apply {
            set("Authorization", "Bearer ${jwtProvider.createAccessToken(MEMBER_ID, ROLE)}")
        }

        // when
        val session = connect(headers)

        // then
        assertThat(session.isConnected).isTrue()
        session.disconnect()
    }

    @Test
    fun `토큰이 없으면 연결되지 않는다`() {
        // when
        val thrown = runCatching { connect(StompHeaders()) }.exceptionOrNull()

        // then
        assertThat(thrown).isInstanceOf(ExecutionException::class.java)
    }

    private fun connect(headers: StompHeaders): StompSession {
        val client = WebSocketStompClient(StandardWebSocketClient())
        client.messageConverter = StringMessageConverter()

        return client
            .connectAsync("ws://localhost:$port${WebSocketConfig.ENDPOINT}", null, headers, Handler())
            .get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
    }

    private class Handler : StompSessionHandlerAdapter()

    companion object {

        private const val MEMBER_ID = 1L
        private const val ROLE = "MEMBER"

        private const val TIMEOUT_SECONDS = 5L
    }
}
