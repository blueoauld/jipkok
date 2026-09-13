package com.blueoauld.server.global.config

import com.blueoauld.server.global.security.StompAuthenticationInterceptor
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Lazy
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.scheduling.TaskScheduler
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(

    private val stompAuthenticationInterceptor: StompAuthenticationInterceptor,
    @param:Lazy @param:Qualifier(MESSAGE_BROKER_TASK_SCHEDULER) private val messageBrokerTaskScheduler: TaskScheduler,
) : WebSocketMessageBrokerConfigurer {

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint(ENDPOINT).setAllowedOriginPatterns(ALLOWED_ORIGIN_PATTERN)
    }

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        registry.enableSimpleBroker(QUEUE_PREFIX)
            .setHeartbeatValue(longArrayOf(HEARTBEAT_INTERVAL_MILLIS, HEARTBEAT_INTERVAL_MILLIS))
            .setTaskScheduler(messageBrokerTaskScheduler)
        registry.setUserDestinationPrefix(USER_PREFIX)
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(stompAuthenticationInterceptor)
    }

    companion object {

        const val ENDPOINT = "/ws"
        const val USER_PREFIX = "/user"

        private const val QUEUE_PREFIX = "/queue"
        private const val MESSAGE_BROKER_TASK_SCHEDULER = "messageBrokerTaskScheduler"
        private const val HEARTBEAT_INTERVAL_MILLIS = 10_000L
        private const val ALLOWED_ORIGIN_PATTERN = "*"
    }
}
