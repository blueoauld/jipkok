package com.blueoauld.server.domain.suspension.web

import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder

class ServiceSuspensionInterceptorTest {

    private val memberSuspensionService = mockk<MemberSuspensionService>(relaxed = true)

    private val interceptor = ServiceSuspensionInterceptor(memberSuspensionService)

    private val request = mockk<HttpServletRequest>(relaxed = true)

    private val response = mockk<HttpServletResponse>(relaxed = true)

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `정지가 없으면 통과한다`() {
        // given
        authenticate()

        // when
        val proceeded = interceptor.preHandle(request, response, Any())

        // then
        assertThat(proceeded).isTrue()
        verify { memberSuspensionService.check(MEMBER_ID, SuspensionType.SERVICE) }
    }

    @Test
    fun `서비스 정지 중이면 막는다`() {
        // given
        authenticate()
        every {
            memberSuspensionService.check(MEMBER_ID, SuspensionType.SERVICE)
        } throws BusinessException(ErrorCode.SERVICE_SUSPENDED)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            interceptor.preHandle(request, response, Any())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SERVICE_SUSPENDED)
    }

    @Test
    fun `로그인하지 않았으면 검사하지 않는다`() {
        // when
        val proceeded = interceptor.preHandle(request, response, Any())

        // then
        assertThat(proceeded).isTrue()
        verify(exactly = 0) { memberSuspensionService.check(any(), any()) }
    }

    private fun authenticate() {
        SecurityContextHolder.getContext().authentication =
            UsernamePasswordAuthenticationToken(MEMBER_ID, null, emptyList())
    }

    companion object {

        private const val MEMBER_ID = 1L
    }
}
