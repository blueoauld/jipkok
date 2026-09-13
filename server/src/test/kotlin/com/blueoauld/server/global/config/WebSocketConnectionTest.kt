package com.blueoauld.server.global.config

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.global.security.JwtProvider
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.fail
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import org.springframework.messaging.converter.StringMessageConverter
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.stomp.StompFrameHandler
import org.springframework.messaging.simp.stomp.StompHeaders
import org.springframework.messaging.simp.stomp.StompSession
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter
import org.springframework.scheduling.TaskScheduler
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler
import org.springframework.web.socket.client.standard.StandardWebSocketClient
import org.springframework.web.socket.messaging.WebSocketStompClient
import java.lang.reflect.Type
import java.util.concurrent.BlockingQueue
import java.util.concurrent.ExecutionException
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit

@Import(TestcontainersConfiguration::class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WebSocketConnectionTest {

    @LocalServerPort
    private var port: Int = 0

    @Autowired
    private lateinit var jwtProvider: JwtProvider

    @Autowired
    private lateinit var messagingTemplate: SimpMessagingTemplate

    @Test
    fun `액세스 토큰을 주면 연결된다`() {
        // given
        val headers = authorized(MEMBER_ID)

        // when
        val session = connect(headers)

        // then
        assertThat(session.isConnected).isTrue()
        session.disconnect()
    }

    @Test
    fun `하트비트를 요청하면 서버도 같은 간격의 하트비트로 응답한다`() {
        // given
        val connected = LinkedBlockingQueue<StompHeaders>()
        val scheduler = ThreadPoolTaskScheduler().apply { initialize() }
        val headers = authorized(MEMBER_ID).apply { heartbeat = longArrayOf(HEARTBEAT_MILLIS, HEARTBEAT_MILLIS) }

        // when
        val session = connect(headers, ConnectedHandler(connected), scheduler)

        // then
        assertThat(connected.poll(TIMEOUT_SECONDS, TimeUnit.SECONDS)?.heartbeat)
            .containsExactly(HEARTBEAT_MILLIS, HEARTBEAT_MILLIS)
        session.disconnect()
        scheduler.shutdown()
    }

    @Test
    fun `토큰이 없으면 연결되지 않는다`() {
        // when
        val thrown = runCatching { connect(StompHeaders()) }.exceptionOrNull()

        // then
        assertThat(thrown).isInstanceOf(ExecutionException::class.java)
    }

    @Test
    fun `개인 큐가 아닌 목적지를 구독하면 오류를 보내고 연결을 끊는다`() {
        // given
        val errors = LinkedBlockingQueue<StompHeaders>()
        val session = connect(authorized(MEMBER_ID), Handler(errors))

        // when
        session.subscribe("/queue/**", Frames(LinkedBlockingQueue()))

        // then
        assertThat(errors.poll(TIMEOUT_SECONDS, TimeUnit.SECONDS)).isNotNull()
    }

    @Test
    fun `개인 큐에 와일드카드를 써도 남의 채팅 이벤트는 받지 못한다`() {
        // given
        val otherFrames = LinkedBlockingQueue<String>()
        val myFrames = LinkedBlockingQueue<String>()
        val other = connect(authorized(OTHER_MEMBER_ID)).apply { subscribe("/user/queue/**", Frames(otherFrames)) }
        val me = connect(authorized(MEMBER_ID)).apply { subscribe("/user$CHAT_DESTINATION", Frames(myFrames)) }
        sendUntilReceived(OTHER_MEMBER_ID, otherFrames, OTHER_PAYLOAD)

        // when
        sendUntilReceived(MEMBER_ID, myFrames, MY_PAYLOAD)

        // then
        TimeUnit.MILLISECONDS.sleep(QUIET_MILLIS)
        assertThat(otherFrames).doesNotContain(MY_PAYLOAD)
        other.disconnect()
        me.disconnect()
    }

    private fun sendUntilReceived(memberId: Long, frames: BlockingQueue<String>, payload: String) {
        repeat(MAX_SEND_ATTEMPTS) {
            messagingTemplate.convertAndSendToUser(memberId.toString(), CHAT_DESTINATION, payload)

            if (frames.poll(POLL_MILLIS, TimeUnit.MILLISECONDS) == payload) {
                return
            }
        }

        fail<Unit>("구독한 큐로 메시지가 오지 않았다. memberId=$memberId")
    }

    private fun authorized(memberId: Long) = StompHeaders().apply {
        set("Authorization", "Bearer ${jwtProvider.createAccessToken(memberId, ROLE)}")
    }

    private fun connect(
        headers: StompHeaders,
        handler: StompSessionHandlerAdapter = Handler(),
        taskScheduler: TaskScheduler? = null,
    ): StompSession {
        val client = WebSocketStompClient(StandardWebSocketClient())
        client.messageConverter = StringMessageConverter()
        taskScheduler?.let { client.taskScheduler = it }

        return client
            .connectAsync("ws://localhost:$port${WebSocketConfig.ENDPOINT}", null, headers, handler)
            .get(TIMEOUT_SECONDS, TimeUnit.SECONDS)
    }

    private class Handler(private val errors: BlockingQueue<StompHeaders> = LinkedBlockingQueue()) :
        StompSessionHandlerAdapter() {

        override fun handleFrame(headers: StompHeaders, payload: Any?) {
            errors.add(headers)
        }
    }

    private class ConnectedHandler(private val connected: BlockingQueue<StompHeaders>) : StompSessionHandlerAdapter() {

        override fun afterConnected(session: StompSession, connectedHeaders: StompHeaders) {
            connected.add(connectedHeaders)
        }
    }

    private class Frames(private val frames: BlockingQueue<String>) : StompFrameHandler {

        override fun getPayloadType(headers: StompHeaders): Type = String::class.java

        override fun handleFrame(headers: StompHeaders, payload: Any?) {
            frames.add(payload as String)
        }
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val OTHER_MEMBER_ID = 2L
        private const val ROLE = "MEMBER"
        private const val CHAT_DESTINATION = "/queue/chat"
        private const val MY_PAYLOAD = "mine"
        private const val OTHER_PAYLOAD = "other"

        private const val TIMEOUT_SECONDS = 5L
        private const val HEARTBEAT_MILLIS = 10_000L
        private const val POLL_MILLIS = 100L
        private const val MAX_SEND_ATTEMPTS = 50
        private const val QUIET_MILLIS = 500L
    }
}
