package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.request.LoginRequest
import com.blueoauld.server.domain.auth.dto.request.ReissueRequest
import com.blueoauld.server.domain.auth.repository.LoginAttemptCache
import com.blueoauld.server.domain.auth.repository.LoginAttemptCount
import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.security.JwtProvider
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.*

class AuthServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val refreshTokenRepository = mockk<RefreshTokenRepository>(relaxed = true)

    private val loginAttemptCache = mockk<LoginAttemptCache>(relaxed = true)

    private val passwordEncoder = mockk<PasswordEncoder>()

    private val jwtProvider = mockk<JwtProvider>()

    private val authService = AuthService(
        memberRepository,
        refreshTokenRepository,
        loginAttemptCache,
        passwordEncoder,
        jwtProvider,
    )

    @BeforeEach
    fun setUp() {
        every { jwtProvider.createAccessToken(any(), any()) } returns ACCESS_TOKEN
        every { jwtProvider.createRefreshToken(MEMBER_ID) } returns NEW_REFRESH_TOKEN
        every { jwtProvider.parseRefreshTokenMemberId(REFRESH_TOKEN) } returns MEMBER_ID
        stubAttemptCount(0, 0)
    }

    @Test
    fun `번호와 비밀번호가 맞으면 토큰을 발급하고 회원 앞으로 저장한다`() {
        // given
        stubMember(member())
        every { passwordEncoder.matches(PASSWORD, ENCODED_PASSWORD) } returns true

        // when
        val response = authService.login(LoginRequest(PHONE_NUMBER, PASSWORD), IP_ADDRESS)

        // then
        verify { refreshTokenRepository.save(MEMBER_ID, NEW_REFRESH_TOKEN) }
        assertThat(response.accessToken).isEqualTo(ACCESS_TOKEN)
        assertThat(response.refreshToken).isEqualTo(NEW_REFRESH_TOKEN)
    }

    @Test
    fun `가입되지 않은 번호면 로그인에 실패한다`() {
        // given
        stubMember(null)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            authService.login(LoginRequest(PHONE_NUMBER, PASSWORD), IP_ADDRESS)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.LOGIN_FAILED)
        verify(exactly = 0) { refreshTokenRepository.save(any(), any()) }
    }

    @Test
    fun `비밀번호가 틀리면 같은 오류로 실패한다`() {
        // given
        stubMember(member())
        every { passwordEncoder.matches(PASSWORD, ENCODED_PASSWORD) } returns false

        // when
        val exception = assertThrows(BusinessException::class.java) {
            authService.login(LoginRequest(PHONE_NUMBER, PASSWORD), IP_ADDRESS)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.LOGIN_FAILED)
        verify(exactly = 0) { refreshTokenRepository.save(any(), any()) }
    }

    @Test
    fun `로그인에 실패하면 시도 횟수를 올린다`() {
        // given
        stubMember(member())
        every { passwordEncoder.matches(PASSWORD, ENCODED_PASSWORD) } returns false

        // when
        assertThrows(BusinessException::class.java) {
            authService.login(LoginRequest(PHONE_NUMBER, PASSWORD), IP_ADDRESS)
        }

        // then
        verify { loginAttemptCache.increase(PHONE_NUMBER, IP_ADDRESS) }
    }

    @Test
    fun `로그인에 성공하면 번호의 시도 횟수를 지운다`() {
        // given
        stubMember(member())
        every { passwordEncoder.matches(PASSWORD, ENCODED_PASSWORD) } returns true

        // when
        authService.login(LoginRequest(PHONE_NUMBER, PASSWORD), IP_ADDRESS)

        // then
        verify { loginAttemptCache.clear(PHONE_NUMBER) }
    }

    @Test
    fun `번호의 시도 횟수를 넘기면 비밀번호를 확인하지 않고 막는다`() {
        // given
        stubAttemptCount(AuthService.PHONE_NUMBER_ATTEMPT_LIMIT.toLong(), 0)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            authService.login(LoginRequest(PHONE_NUMBER, PASSWORD), IP_ADDRESS)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.LOGIN_ATTEMPT_EXCEEDED)
        verify(exactly = 0) { passwordEncoder.matches(any(), any()) }
        verify(exactly = 0) { loginAttemptCache.increase(any(), any()) }
    }

    @Test
    fun `IP의 시도 횟수를 넘겨도 막는다`() {
        // given
        stubAttemptCount(0, AuthService.IP_ADDRESS_ATTEMPT_LIMIT.toLong())

        // when
        val exception = assertThrows(BusinessException::class.java) {
            authService.login(LoginRequest(PHONE_NUMBER, PASSWORD), IP_ADDRESS)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.LOGIN_ATTEMPT_EXCEEDED)
        verify(exactly = 0) { passwordEncoder.matches(any(), any()) }
    }

    @Test
    fun `저장된 토큰과 같으면 새 토큰으로 덮어쓴다`() {
        // given
        stubStoredToken(REFRESH_TOKEN)
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())

        // when
        val response = authService.reissue(ReissueRequest(REFRESH_TOKEN))

        // then
        verify { refreshTokenRepository.save(MEMBER_ID, NEW_REFRESH_TOKEN) }
        assertThat(response.refreshToken).isEqualTo(NEW_REFRESH_TOKEN)
    }

    @Test
    fun `서명이 어긋난 리프레시 토큰이면 재발급에 실패한다`() {
        // given
        every { jwtProvider.parseRefreshTokenMemberId(REFRESH_TOKEN) } returns null

        // when
        val exception = assertThrows(BusinessException::class.java) {
            authService.reissue(ReissueRequest(REFRESH_TOKEN))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN)
        verify(exactly = 0) { refreshTokenRepository.save(any(), any()) }
    }

    @Test
    fun `저장된 토큰이 없으면 재발급에 실패한다`() {
        // given
        stubStoredToken(null)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            authService.reissue(ReissueRequest(REFRESH_TOKEN))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN)
        verify(exactly = 0) { refreshTokenRepository.save(any(), any()) }
    }

    @Test
    fun `이미 회전된 토큰이 다시 들어오면 저장된 토큰까지 지운다`() {
        // given
        stubStoredToken("another-refresh-token")

        // when
        val exception = assertThrows(BusinessException::class.java) {
            authService.reissue(ReissueRequest(REFRESH_TOKEN))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN)
        verify { refreshTokenRepository.delete(MEMBER_ID) }
        verify(exactly = 0) { refreshTokenRepository.save(any(), any()) }
    }

    @Test
    fun `탈퇴한 회원의 리프레시 토큰이면 재발급에 실패한다`() {
        // given
        stubStoredToken(REFRESH_TOKEN)
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            authService.reissue(ReissueRequest(REFRESH_TOKEN))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN)
        verify(exactly = 0) { refreshTokenRepository.save(any(), any()) }
    }

    @Test
    fun `로그아웃하면 회원의 리프레시 토큰을 지운다`() {
        // given

        // when
        authService.logout(REFRESH_TOKEN)

        // then
        verify { refreshTokenRepository.delete(MEMBER_ID) }
    }

    @Test
    fun `읽을 수 없는 토큰으로 로그아웃하면 아무것도 지우지 않는다`() {
        // given
        every { jwtProvider.parseRefreshTokenMemberId(REFRESH_TOKEN) } returns null

        // when
        authService.logout(REFRESH_TOKEN)

        // then
        verify(exactly = 0) { refreshTokenRepository.delete(any()) }
    }

    private fun member() = Member(
        phoneNumber = PHONE_NUMBER,
        password = ENCODED_PASSWORD,
        gender = Gender.MALE,
        nickname = "nickname",
        birthYear = 1998,
    )

    private fun stubMember(member: Member?) {
        every { memberRepository.findByPhoneNumber(PHONE_NUMBER) } returns member
    }

    private fun stubStoredToken(token: String?) {
        every { refreshTokenRepository.findToken(MEMBER_ID) } returns token
    }

    private fun stubAttemptCount(phoneNumber: Long, ipAddress: Long) {
        every { loginAttemptCache.find(PHONE_NUMBER, IP_ADDRESS) } returns
                LoginAttemptCount(phoneNumber, ipAddress)
    }

    companion object {

        private const val IP_ADDRESS = "203.0.113.7"
        private const val PHONE_NUMBER = "01012345678"
        private const val PASSWORD = "password1234"
        private const val ENCODED_PASSWORD = "encoded-password"
        private const val ACCESS_TOKEN = "access-token"
        private const val REFRESH_TOKEN = "refresh-token"
        private const val NEW_REFRESH_TOKEN = "new-refresh-token"
        private const val MEMBER_ID = 0L
    }
}
