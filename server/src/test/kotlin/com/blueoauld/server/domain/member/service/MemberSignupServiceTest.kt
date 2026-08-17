package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.auth.dto.response.TokenResponse
import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import com.blueoauld.server.domain.auth.service.AuthService
import com.blueoauld.server.domain.auth.service.VerificationCodeService
import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.*

class MemberSignupServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val nicknameHistoryRepository = mockk<NicknameHistoryRepository>(relaxed = true)

    private val verificationCodeService = mockk<VerificationCodeService>(relaxed = true)

    private val authService = mockk<AuthService>()

    private val passwordEncoder = mockk<PasswordEncoder>()

    private val memberSuspensionService = mockk<MemberSuspensionService>(relaxed = true)

    private val memberSignupService = MemberSignupService(
        memberRepository,
        nicknameHistoryRepository,
        verificationCodeService,
        authService,
        passwordEncoder,
        memberSuspensionService,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.existsByPhoneNumber(PHONE_NUMBER) } returns false
        every { memberRepository.save(any()) } answers { firstArg() }
        every { nicknameHistoryRepository.save(any()) } answers { firstArg() }
        every { passwordEncoder.encode(PASSWORD) } returns ENCODED_PASSWORD
        every { authService.issueTokens(any()) } returns TokenResponse(ACCESS_TOKEN, REFRESH_TOKEN)
    }

    @Test
    fun `인증번호가 확인되면 회원을 만들고 토큰을 발급한다`() {
        // given
        val saved = slot<Member>()

        // when
        val response = memberSignupService.signup(signupRequest())

        // then
        verify { verificationCodeService.verify(PHONE_NUMBER, VERIFICATION_CODE, VerificationPurpose.SIGNUP) }
        verify { memberRepository.save(capture(saved)) }
        assertThat(saved.captured.phoneNumber).isEqualTo(PHONE_NUMBER)
        assertThat(saved.captured.gender).isEqualTo(Gender.MALE)
        assertThat(response.accessToken).isEqualTo(ACCESS_TOKEN)
        assertThat(response.refreshToken).isEqualTo(REFRESH_TOKEN)
    }

    @Test
    fun `비밀번호를 해싱해서 저장한다`() {
        // given
        val saved = slot<Member>()

        // when
        memberSignupService.signup(signupRequest())

        // then
        verify { memberRepository.save(capture(saved)) }
        assertThat(saved.captured.password).isEqualTo(ENCODED_PASSWORD)
        assertThat(saved.captured.password).isNotEqualTo(PASSWORD)
    }

    @Test
    fun `닉네임은 열 자리 임의 문자열로, 출생연도는 기본값으로 채운다`() {
        // given
        val saved = slot<Member>()

        // when
        memberSignupService.signup(signupRequest())

        // then
        verify { memberRepository.save(capture(saved)) }
        assertThat(saved.captured.nickname).hasSize(Member.NICKNAME_MAX_LENGTH)
        assertThat(saved.captured.nickname).matches("[0-9a-f]+")
        assertThat(saved.captured.birthYear).isEqualTo(MemberSignupService.DEFAULT_BIRTH_YEAR)
    }

    @Test
    fun `가입할 때마다 닉네임이 달라진다`() {
        // given
        val saved = mutableListOf<Member>()

        // when
        memberSignupService.signup(signupRequest())
        memberSignupService.signup(signupRequest())

        // then
        verify { memberRepository.save(capture(saved)) }
        assertThat(saved[0].nickname).isNotEqualTo(saved[1].nickname)
    }

    @Test
    fun `비밀번호 확인이 다르면 인증번호를 확인하지 않고 실패한다`() {
        // given
        val request = signupRequest(passwordConfirm = "different-password")

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSignupService.signup(request)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.PASSWORD_CONFIRM_MISMATCH)
        verify(exactly = 0) { verificationCodeService.verify(any(), any(), any()) }
        verify(exactly = 0) { memberRepository.save(any()) }
    }

    @Test
    fun `이미 가입된 번호면 회원을 만들지 않는다`() {
        // given
        every { memberRepository.existsByPhoneNumber(PHONE_NUMBER) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSignupService.signup(signupRequest())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_PHONE_NUMBER)
        verify(exactly = 0) { memberRepository.save(any()) }
    }

    @Test
    fun `인증번호 확인에 실패하면 회원을 만들지 않는다`() {
        // given
        every {
            verificationCodeService.verify(PHONE_NUMBER, VERIFICATION_CODE, VerificationPurpose.SIGNUP)
        } throws BusinessException(ErrorCode.VERIFICATION_CODE_MISMATCH)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSignupService.signup(signupRequest())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.VERIFICATION_CODE_MISMATCH)
        verify(exactly = 0) { memberRepository.save(any()) }
    }

    @Test
    fun `정지된 휴대폰 번호로는 가입할 수 없다`() {
        // given
        every {
            memberSuspensionService.checkPhoneNumber(PHONE_NUMBER, SuspensionType.SERVICE)
        } throws BusinessException(ErrorCode.SERVICE_SUSPENDED)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberSignupService.signup(signupRequest())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SERVICE_SUSPENDED)
        verify(exactly = 0) { memberRepository.save(any()) }
    }

    private fun signupRequest(passwordConfirm: String = PASSWORD) = SignupRequest(
        phoneNumber = PHONE_NUMBER,
        verificationCode = VERIFICATION_CODE,
        password = PASSWORD,
        passwordConfirm = passwordConfirm,
        gender = Gender.MALE,
    )

    companion object {

        private const val PHONE_NUMBER = "01012345678"
        private const val VERIFICATION_CODE = "123456"
        private const val PASSWORD = "password1234"
        private const val ENCODED_PASSWORD = "encoded-password"
        private const val ACCESS_TOKEN = "access-token"
        private const val REFRESH_TOKEN = "refresh-token"
    }
}
