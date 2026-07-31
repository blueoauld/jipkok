package com.blueoauld.server.global.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(

    private val jwtProvider: JwtProvider,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        resolveToken(request)
            ?.let(jwtProvider::parseAccessToken)
            ?.let { SecurityContextHolder.getContext().authentication = toAuthentication(it) }

        filterChain.doFilter(request, response)
    }

    private fun resolveToken(request: HttpServletRequest): String? =
        request.getHeader(HttpHeaders.AUTHORIZATION)
            ?.takeIf { it.startsWith(BEARER_PREFIX) }
            ?.removePrefix(BEARER_PREFIX)

    private fun toAuthentication(payload: JwtPayload) = UsernamePasswordAuthenticationToken(
        payload.memberId,
        null,
        listOf(SimpleGrantedAuthority(ROLE_PREFIX + payload.role)),
    )

    companion object {

        private const val BEARER_PREFIX = "Bearer "
        private const val ROLE_PREFIX = "ROLE_"
    }
}
