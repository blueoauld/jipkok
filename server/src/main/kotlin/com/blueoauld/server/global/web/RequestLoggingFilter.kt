package com.blueoauld.server.global.web

import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.*
import java.util.concurrent.TimeUnit

private val log = KotlinLogging.logger {}

@Order(Ordered.HIGHEST_PRECEDENCE)
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
        putClientInfo(request)
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
        append("${request.method} ${maskPath(request.requestURI)}")
        request.queryString?.let { append("?${maskQuery(it)}") }
        append(" $status ${elapsedMillis}ms")
    }

    private fun maskPath(path: String) = SENSITIVE_PATH_PATTERN.replace(path) { "${it.groupValues[1]}***" }

    private fun maskQuery(queryString: String) =
        SENSITIVE_PARAM_PATTERN.replace(queryString) { "${it.groupValues[1]}=***" }

    private fun putClientInfo(request: HttpServletRequest) {
        request.getHeader(APP_VERSION_HEADER)?.let { MDC.put(APP_VERSION_KEY, it) }
        request.getHeader(PLATFORM_HEADER)?.let { MDC.put(PLATFORM_KEY, it) }
    }

    private fun newRequestId() = UUID.randomUUID().toString().take(REQUEST_ID_LENGTH)

    private fun elapsedMillis(startedAt: Long) = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt)

    companion object {

        const val REQUEST_ID_KEY = "requestId"
        const val MEMBER_ID_KEY = "memberId"
        const val APP_VERSION_KEY = "appVersion"
        const val PLATFORM_KEY = "platform"

        const val REQUEST_ID_HEADER = "X-Request-Id"

        const val APP_VERSION_HEADER = "X-App-Version"

        private val SENSITIVE_PARAM_PATTERN = Regex("((?:^|&)(?:keyword|reportedPhoneNumber|to))=[^&]*")
        private val SENSITIVE_PATH_PATTERN = Regex("(/device-tokens/)[^/]+")
        private const val PLATFORM_HEADER = "X-Platform"

        private const val API_PATH_PREFIX = "/api/"
        private const val REQUEST_ID_LENGTH = 8
    }
}
