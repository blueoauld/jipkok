package com.blueoauld.server.global.security

import com.blueoauld.server.global.web.RequestLoggingFilter
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.slf4j.MDC
import org.springframework.http.HttpHeaders
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder

class JwtAuthenticationFilterTest {

    private val jwtProvider = mockk<JwtProvider>()

    private val filter = JwtAuthenticationFilter(jwtProvider)

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
        MDC.clear()
    }

    @Test
    fun `올바른 Bearer 토큰이면 회원 id와 역할로 인증을 세운다`() {
        // given
        every { jwtProvider.parseAccessToken(TOKEN) } returns JwtPayload(MEMBER_ID, ROLE)
        val request = requestWith("Bearer $TOKEN")
        val chain = MockFilterChain()

        // when
        filter.doFilter(request, MockHttpServletResponse(), chain)

        // then
        val authentication = SecurityContextHolder.getContext().authentication

        assertThat(authentication?.principal).isEqualTo(MEMBER_ID)
        assertThat(authentication?.authorities?.map { it.authority }).containsExactly("ROLE_$ROLE")
        assertThat(MDC.get(RequestLoggingFilter.MEMBER_ID_KEY)).isEqualTo(MEMBER_ID.toString())
        assertThat(chain.request).isSameAs(request)
    }

    @Test
    fun `토큰이 유효하지 않으면 인증 없이 다음 필터로 넘긴다`() {
        // given
        every { jwtProvider.parseAccessToken(TOKEN) } returns null
        val chain = MockFilterChain()

        // when
        filter.doFilter(requestWith("Bearer $TOKEN"), MockHttpServletResponse(), chain)

        // then
        assertThat(SecurityContextHolder.getContext().authentication).isNull()
        assertThat(MDC.get(RequestLoggingFilter.MEMBER_ID_KEY)).isNull()
        assertThat(chain.request).isNotNull
    }

    @Test
    fun `Authorization 헤더가 없으면 토큰을 읽지 않는다`() {
        // given
        val chain = MockFilterChain()

        // when
        filter.doFilter(MockHttpServletRequest(), MockHttpServletResponse(), chain)

        // then
        verify(exactly = 0) { jwtProvider.parseAccessToken(any()) }
        assertThat(SecurityContextHolder.getContext().authentication).isNull()
        assertThat(chain.request).isNotNull
    }

    @Test
    fun `Bearer 형식이 아니면 토큰을 읽지 않는다`() {
        // given
        val chain = MockFilterChain()

        // when
        filter.doFilter(requestWith("Basic $TOKEN"), MockHttpServletResponse(), chain)

        // then
        verify(exactly = 0) { jwtProvider.parseAccessToken(any()) }
        assertThat(SecurityContextHolder.getContext().authentication).isNull()
    }

    private fun requestWith(authorization: String) = MockHttpServletRequest().apply {
        addHeader(HttpHeaders.AUTHORIZATION, authorization)
    }

    companion object {

        private const val TOKEN = "token"
        private const val MEMBER_ID = 7L
        private const val ROLE = "MEMBER"
    }
}
