package com.blueoauld.server.global.web

import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.concurrent.TimeUnit

private val log = KotlinLogging.logger {}

@Component
class RequestLoggingFilter : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val startedAt = System.nanoTime()

        try {
            filterChain.doFilter(request, response)
        } finally {
            log.info { describe(request, response.status, elapsedMillis(startedAt)) }
        }
    }

    override fun shouldNotFilter(request: HttpServletRequest) = !request.requestURI.startsWith(API_PATH_PREFIX)

    private fun describe(request: HttpServletRequest, status: Int, elapsedMillis: Long) = buildString {
        append("${request.method} ${request.requestURI}")
        request.queryString?.let { append("?$it") }
        append(" $status ${elapsedMillis}ms")
        memberId()?.let { append(" memberId=$it") }
    }

    private fun memberId() = SecurityContextHolder.getContext().authentication?.principal as? Long

    private fun elapsedMillis(startedAt: Long) = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt)

    companion object {

        private const val API_PATH_PREFIX = "/api/"
    }
}
