package com.blueoauld.server.global.security

import com.blueoauld.server.global.web.RequestLoggingFilter
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.MDC
import org.springframework.http.HttpHeaders
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
        jwtProvider.authenticateBearer(request.getHeader(HttpHeaders.AUTHORIZATION))?.let {
            SecurityContextHolder.getContext().authentication = it
            MDC.put(RequestLoggingFilter.MEMBER_ID_KEY, it.principal.toString())
        }

        filterChain.doFilter(request, response)
    }
}
