package com.blueoauld.server.global.security

import com.blueoauld.server.global.config.WebSocketConfig
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.http.HttpHeaders
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.stereotype.Component

@Component
class StompAuthenticationInterceptor(

    private val jwtProvider: JwtProvider,
) : ChannelInterceptor {

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)

        when (accessor?.command) {
            StompCommand.CONNECT ->
                accessor.user = jwtProvider.authenticateBearer(accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION))
                    ?: throw BusinessException(ErrorCode.UNAUTHORIZED)

            StompCommand.SUBSCRIBE ->
                if (accessor.destination?.startsWith(USER_DESTINATION_PREFIX) != true) {
                    throw BusinessException(ErrorCode.FORBIDDEN)
                }

            StompCommand.SEND -> throw BusinessException(ErrorCode.FORBIDDEN)

            else -> Unit
        }

        return message
    }

    companion object {

        private const val USER_DESTINATION_PREFIX = "${WebSocketConfig.USER_PREFIX}/"
    }
}
