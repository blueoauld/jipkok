package com.blueoauld.server.global.config

import com.blueoauld.server.global.security.StompAuthenticationInterceptor
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(

    private val stompAuthenticationInterceptor: StompAuthenticationInterceptor,
) : WebSocketMessageBrokerConfigurer {

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint(ENDPOINT).setAllowedOriginPatterns(ALLOWED_ORIGIN_PATTERN)
    }

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        registry.enableSimpleBroker(QUEUE_PREFIX)
        registry.setUserDestinationPrefix(USER_PREFIX)
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(stompAuthenticationInterceptor)
    }

    companion object {

        const val ENDPOINT = "/ws"

        private const val QUEUE_PREFIX = "/queue"
        private const val USER_PREFIX = "/user"
        private const val ALLOWED_ORIGIN_PATTERN = "*"
    }
}
