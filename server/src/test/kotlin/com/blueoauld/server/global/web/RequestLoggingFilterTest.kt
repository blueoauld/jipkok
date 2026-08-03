package com.blueoauld.server.global.web

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import io.mockk.mockk
import jakarta.servlet.FilterChain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder

class RequestLoggingFilterTest {

    private val filter = RequestLoggingFilter()

    private val logger = LoggerFactory.getLogger(RequestLoggingFilter::class.java) as Logger

    private val appender = ListAppender<ILoggingEvent>()

    @BeforeEach
    fun setUp() {
        appender.start()
        logger.addAppender(appender)
        logger.level = Level.INFO
    }

    @AfterEach
    fun tearDown() {
        logger.detachAppender(appender)
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `메서드와 경로와 상태와 소요 시간을 남긴다`() {
        // given
        val request = MockHttpServletRequest("GET", "/api/members/me")
        val response = MockHttpServletResponse()

        // when
        filter.doFilter(request, response, mockk<FilterChain>(relaxed = true))

        // then
        assertThat(message()).startsWith("GET /api/members/me 200 ")
        assertThat(message()).endsWith("ms")
    }

    @Test
    fun `쿼리 문자열을 함께 남긴다`() {
        // given
        val request = MockHttpServletRequest("GET", "/api/members")
        request.queryString = "size=3"

        // when
        filter.doFilter(request, MockHttpServletResponse(), mockk<FilterChain>(relaxed = true))

        // then
        assertThat(message()).contains("/api/members?size=3")
    }

    @Test
    fun `로그인한 회원이면 회원 id를 남긴다`() {
        // given
        SecurityContextHolder.getContext().authentication =
            UsernamePasswordAuthenticationToken(MEMBER_ID, null, emptyList())

        // when
        filter.doFilter(
            MockHttpServletRequest("GET", "/api/members/me"),
            MockHttpServletResponse(),
            mockk<FilterChain>(relaxed = true),
        )

        // then
        assertThat(message()).endsWith("memberId=$MEMBER_ID")
    }

    @Test
    fun `로그인하지 않았으면 회원 id를 남기지 않는다`() {
        // when
        filter.doFilter(
            MockHttpServletRequest("POST", "/api/auth/login"),
            MockHttpServletResponse(),
            mockk<FilterChain>(relaxed = true),
        )

        // then
        assertThat(message()).doesNotContain("memberId")
    }

    @Test
    fun `api 경로가 아니면 남기지 않는다`() {
        // when
        filter.doFilter(
            MockHttpServletRequest("GET", "/v3/api-docs"),
            MockHttpServletResponse(),
            mockk<FilterChain>(relaxed = true),
        )

        // then
        assertThat(appender.list).isEmpty()
    }

    private fun message() = appender.list.single().formattedMessage

    companion object {

        private const val MEMBER_ID = 42L
    }
}
