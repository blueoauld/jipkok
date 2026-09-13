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
import org.slf4j.MDC
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse

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
        MDC.clear()
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
    fun `검색어는 가리고 나머지 파라미터는 남긴다`() {
        // given
        val request = MockHttpServletRequest("GET", "/api/members/search")
        request.queryString = "keyword=홍길동&size=3"

        // when
        filter.doFilter(request, MockHttpServletResponse(), mockk<FilterChain>(relaxed = true))

        // then
        assertThat(message()).contains("keyword=***")
        assertThat(message()).doesNotContain("홍길동")
        assertThat(message()).contains("size=3")
    }

    @Test
    fun `신고 조회의 전화번호도 가린다`() {
        // given
        val request = MockHttpServletRequest("GET", "/api/admin/reports")
        request.queryString = "reportedPhoneNumber=%2B821012345678"

        // when
        filter.doFilter(request, MockHttpServletResponse(), mockk<FilterChain>(relaxed = true))

        // then
        assertThat(message()).contains("reportedPhoneNumber=***")
        assertThat(message()).doesNotContain("821012345678")
    }

    @Test
    fun `문자 발송 내역의 수신 번호도 가리고 이름이 겹치는 다른 파라미터는 남긴다`() {
        // given
        val request = MockHttpServletRequest("GET", "/api/admin/messages")
        request.queryString = "status=FAILED&to=%2B821012345678&photo=keep"

        // when
        filter.doFilter(request, MockHttpServletResponse(), mockk<FilterChain>(relaxed = true))

        // then
        assertThat(message()).contains("status=FAILED&to=***&photo=keep")
        assertThat(message()).doesNotContain("821012345678")
    }

    @Test
    fun `경로에 담긴 기기 토큰은 가린다`() {
        // given
        val request = MockHttpServletRequest("DELETE", "/api/members/me/device-tokens/ExponentPushToken[abc123]")

        // when
        filter.doFilter(request, MockHttpServletResponse(), mockk<FilterChain>(relaxed = true))

        // then
        assertThat(message()).startsWith("DELETE /api/members/me/device-tokens/*** ")
        assertThat(message()).doesNotContain("abc123")
    }

    @Test
    fun `뒤따르는 필터가 담은 회원 id를 함께 남긴다`() {
        // given
        val chain = FilterChain { _, _ -> MDC.put(RequestLoggingFilter.MEMBER_ID_KEY, MEMBER_ID.toString()) }

        // when
        filter.doFilter(MockHttpServletRequest("GET", "/api/members/me"), MockHttpServletResponse(), chain)

        // then
        assertThat(diagnostics()[RequestLoggingFilter.MEMBER_ID_KEY]).isEqualTo(MEMBER_ID.toString())
    }

    @Test
    fun `로그인하지 않았으면 회원 id를 담지 않는다`() {
        // when
        filter.doFilter(
            MockHttpServletRequest("POST", "/api/auth/login"),
            MockHttpServletResponse(),
            mockk<FilterChain>(relaxed = true),
        )

        // then
        assertThat(diagnostics()).doesNotContainKey(RequestLoggingFilter.MEMBER_ID_KEY)
    }

    @Test
    fun `요청 id를 진단 정보와 응답 헤더에 함께 담는다`() {
        // given
        val response = MockHttpServletResponse()

        // when
        filter.doFilter(MockHttpServletRequest("GET", "/api/members/me"), response, mockk<FilterChain>(relaxed = true))

        // then
        val requestId = diagnostics()[RequestLoggingFilter.REQUEST_ID_KEY]
        assertThat(requestId).isNotBlank()
        assertThat(response.getHeader(RequestLoggingFilter.REQUEST_ID_HEADER)).isEqualTo(requestId)
    }

    @Test
    fun `요청이 끝나면 진단 정보를 비운다`() {
        // when
        filter.doFilter(
            MockHttpServletRequest("GET", "/api/members/me"),
            MockHttpServletResponse(),
            mockk<FilterChain>(relaxed = true),
        )

        // then
        assertThat(MDC.getCopyOfContextMap()).isNullOrEmpty()
    }

    @Test
    fun `클라이언트가 보낸 앱 버전과 플랫폼을 담는다`() {
        // given
        val request = MockHttpServletRequest("GET", "/api/members/me")
        request.addHeader("X-App-Version", APP_VERSION)
        request.addHeader("X-Platform", PLATFORM)

        // when
        filter.doFilter(request, MockHttpServletResponse(), mockk<FilterChain>(relaxed = true))

        // then
        assertThat(diagnostics()[RequestLoggingFilter.APP_VERSION_KEY]).isEqualTo(APP_VERSION)
        assertThat(diagnostics()[RequestLoggingFilter.PLATFORM_KEY]).isEqualTo(PLATFORM)
    }

    @Test
    fun `클라이언트 정보가 없으면 담지 않는다`() {
        // when
        filter.doFilter(
            MockHttpServletRequest("GET", "/api/members/me"),
            MockHttpServletResponse(),
            mockk<FilterChain>(relaxed = true),
        )

        // then
        assertThat(diagnostics()).doesNotContainKeys(
            RequestLoggingFilter.APP_VERSION_KEY,
            RequestLoggingFilter.PLATFORM_KEY,
        )
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

    private fun diagnostics() = appender.list.single().mdcPropertyMap

    companion object {

        private const val MEMBER_ID = 42L

        private const val APP_VERSION = "1.0.0"
        private const val PLATFORM = "IOS"
    }
}
