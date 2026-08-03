package com.blueoauld.server.global.web

import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.MDC
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.*
import java.util.concurrent.TimeUnit

private val log = KotlinLogging.logger {}

@Component
class RequestLoggingFilter : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val requestId = newRequestId()
        val startedAt = System.nanoTime()

        MDC.put(REQUEST_ID_KEY, requestId)
        memberId()?.let { MDC.put(MEMBER_ID_KEY, it.toString()) }
        response.setHeader(REQUEST_ID_HEADER, requestId)

        try {
            filterChain.doFilter(request, response)
        } finally {
            log.info { describe(request, response.status, elapsedMillis(startedAt)) }
            MDC.clear()
        }
    }

    override fun shouldNotFilter(request: HttpServletRequest) = !request.requestURI.startsWith(API_PATH_PREFIX)

    private fun describe(request: HttpServletRequest, status: Int, elapsedMillis: Long) = buildString {
        append("${request.method} ${request.requestURI}")
        request.queryString?.let { append("?$it") }
        append(" $status ${elapsedMillis}ms")
    }

    private fun newRequestId() = UUID.randomUUID().toString().take(REQUEST_ID_LENGTH)

    private fun memberId() = SecurityContextHolder.getContext().authentication?.principal as? Long

    private fun elapsedMillis(startedAt: Long) = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt)

    companion object {

        const val REQUEST_ID_KEY = "requestId"
        const val MEMBER_ID_KEY = "memberId"
        const val REQUEST_ID_HEADER = "X-Request-Id"

        private const val API_PATH_PREFIX = "/api/"
        private const val REQUEST_ID_LENGTH = 8
    }
}
