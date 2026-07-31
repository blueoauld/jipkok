package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.auth.service.AuthService
import com.blueoauld.server.domain.auth.service.VerificationCodeService
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.dto.response.SignupResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId
import java.util.*

@Service
class MemberService(

    private val memberRepository: MemberRepository,
    private val verificationCodeService: VerificationCodeService,
    private val authService: AuthService,
    private val passwordEncoder: PasswordEncoder,
    private val clock: Clock,
) {

    @Transactional
    fun signup(request: SignupRequest): SignupResponse {
        if (request.password != request.passwordConfirm) {
            throw BusinessException(ErrorCode.PASSWORD_CONFIRM_MISMATCH)
        }

        verificationCodeService.verify(request.phoneNumber, request.verificationCode)

        if (memberRepository.existsByPhoneNumber(request.phoneNumber)) {
            throw BusinessException(ErrorCode.DUPLICATE_PHONE_NUMBER)
        }

        val member = memberRepository.save(
            Member(
                phoneNumber = request.phoneNumber,
                password = encodePassword(request.password),
                gender = request.gender,
                nickname = generateNickname(),
                birthYear = DEFAULT_BIRTH_YEAR,
            ),
        )
        val tokens = authService.issueTokens(member)

        return SignupResponse(member.id, tokens.accessToken, tokens.refreshToken)
    }

    @Transactional
    fun setupProfile(memberId: Long, request: SetupProfileRequest) {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        val nickname = request.nickname.trim()

        if (!nickname.equals(member.nickname, ignoreCase = true) &&
            memberRepository.existsByNicknameIgnoreCase(nickname)
        ) {
            throw BusinessException(ErrorCode.DUPLICATE_NICKNAME)
        }

        if (currentYear() - request.birthYear !in MIN_AGE..MAX_AGE) {
            throw BusinessException(ErrorCode.INVALID_BIRTH_YEAR)
        }

        member.nickname = nickname
        member.birthYear = request.birthYear
        member.bio = request.bio
    }

    private fun currentYear() = LocalDate.now(clock.withZone(KOREA)).year

    private fun encodePassword(rawPassword: String) = checkNotNull(passwordEncoder.encode(rawPassword)) {
        "비밀번호를 해싱하지 못했다."
    }

    private fun generateNickname() = UUID.randomUUID().toString().replace("-", "").take(Member.NICKNAME_MAX_LENGTH)

    companion object {

        const val DEFAULT_BIRTH_YEAR = 1998
        const val MIN_AGE = 19
        const val MAX_AGE = 90

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
