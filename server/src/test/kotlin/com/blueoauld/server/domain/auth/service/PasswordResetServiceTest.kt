package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.request.ResetPasswordRequest
import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import com.blueoauld.server.domain.auth.repository.LoginAttemptCache
import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.password.PasswordEncoder

class PasswordResetServiceTest {

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val verificationCodeService = mockk<VerificationCodeService>(relaxed = true)

    private val passwordEncoder = mockk<PasswordEncoder>()

    private val refreshTokenRepository = mockk<RefreshTokenRepository>(relaxed = true)

    private val loginAttemptCache = mockk<LoginAttemptCache>(relaxed = true)

    private val passwordResetService = PasswordResetService(
        memberRepository,
        verificationCodeService,
        passwordEncoder,
        refreshTokenRepository,
        loginAttemptCache,
    )

    private val member = Member(
        phoneNumber = PHONE_NUMBER,
        password = OLD_ENCODED_PASSWORD,
        gender = Gender.MALE,
        nickname = "닉네임",
        birthYear = 1995,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findByPhoneNumber(PHONE_NUMBER) } returns member
        every { passwordEncoder.encode(NEW_PASSWORD) } returns NEW_ENCODED_PASSWORD
    }

    @Test
    fun `인증번호를 확인하고 비밀번호를 바꾼다`() {
        // when
        passwordResetService.reset(request())

        // then
        verify {
            verificationCodeService.verify(
                PHONE_NUMBER,
                VERIFICATION_CODE,
                VerificationPurpose.PASSWORD_RESET,
            )
        }
        assertThat(member.password).isEqualTo(NEW_ENCODED_PASSWORD)
    }

    @Test
    fun `비밀번호를 바꾸면 다른 기기의 로그인을 끊는다`() {
        // when
        passwordResetService.reset(request())

        // then
        verify { refreshTokenRepository.delete(member.id) }
    }

    @Test
    fun `비밀번호를 바꾸면 로그인 시도 제한을 푼다`() {
        // when
        passwordResetService.reset(request())

        // then
        verify { loginAttemptCache.clear(PHONE_NUMBER) }
    }

    @Test
    fun `확인용 비밀번호가 다르면 인증번호를 쓰지 않는다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            passwordResetService.reset(request(passwordConfirm = "다른비밀번호"))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.PASSWORD_CONFIRM_MISMATCH)
        verify(exactly = 0) { verificationCodeService.verify(any(), any(), any()) }
        assertThat(member.password).isEqualTo(OLD_ENCODED_PASSWORD)
    }

    @Test
    fun `가입하지 않은 번호면 바꿀 수 없다`() {
        // given
        every { memberRepository.findByPhoneNumber(PHONE_NUMBER) } returns null

        // when
        val exception = assertThrows(BusinessException::class.java) {
            passwordResetService.reset(request())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { refreshTokenRepository.delete(any()) }
    }

    @Test
    fun `인증번호 확인에 실패하면 비밀번호를 바꾸지 않는다`() {
        // given
        every {
            verificationCodeService.verify(PHONE_NUMBER, VERIFICATION_CODE, VerificationPurpose.PASSWORD_RESET)
        } throws BusinessException(ErrorCode.VERIFICATION_CODE_MISMATCH)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            passwordResetService.reset(request())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.VERIFICATION_CODE_MISMATCH)
        assertThat(member.password).isEqualTo(OLD_ENCODED_PASSWORD)
    }

    private fun request(passwordConfirm: String = NEW_PASSWORD) = ResetPasswordRequest(
        phoneNumber = PHONE_NUMBER,
        verificationCode = VERIFICATION_CODE,
        password = NEW_PASSWORD,
        passwordConfirm = passwordConfirm,
    )

    companion object {

        private const val PHONE_NUMBER = "+821012345678"
        private const val VERIFICATION_CODE = "123456"
        private const val NEW_PASSWORD = "newpassword1"
        private const val OLD_ENCODED_PASSWORD = "encoded-old"
        private const val NEW_ENCODED_PASSWORD = "encoded-new"
    }
}
