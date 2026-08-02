package com.blueoauld.server.global.security

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.http.HttpHeaders
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.stereotype.Component

@Component
class StompAuthenticationInterceptor(

    private val jwtProvider: JwtProvider,
) : ChannelInterceptor {

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)

        if (accessor?.command == StompCommand.CONNECT) {
            accessor.user = authenticate(accessor) ?: throw BusinessException(ErrorCode.UNAUTHORIZED)
        }

        return message
    }

    private fun authenticate(accessor: StompHeaderAccessor) = accessor
        .getFirstNativeHeader(HttpHeaders.AUTHORIZATION)
        ?.takeIf { it.startsWith(BEARER_PREFIX) }
        ?.removePrefix(BEARER_PREFIX)
        ?.let(jwtProvider::parseAccessToken)
        ?.let {
            UsernamePasswordAuthenticationToken(
                it.memberId,
                null,
                listOf(SimpleGrantedAuthority(ROLE_PREFIX + it.role)),
            )
        }

    companion object {

        private const val BEARER_PREFIX = "Bearer "
        private const val ROLE_PREFIX = "ROLE_"
    }
}
