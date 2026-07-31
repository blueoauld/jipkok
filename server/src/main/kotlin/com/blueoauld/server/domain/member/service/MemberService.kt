package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.auth.service.VerificationCodeService
import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.dto.response.SignupResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.security.JwtProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class MemberService(

    private val memberRepository: MemberRepository,
    private val verificationCodeService: VerificationCodeService,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider,
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

        return SignupResponse(member.id, jwtProvider.createAccessToken(member.id, member.role.name))
    }

    private fun encodePassword(rawPassword: String) = checkNotNull(passwordEncoder.encode(rawPassword)) {
        "비밀번호를 해싱하지 못했다."
    }

    private fun generateNickname() = UUID.randomUUID().toString().replace("-", "").take(Member.NICKNAME_MAX_LENGTH)

    companion object {

        const val DEFAULT_BIRTH_YEAR = 1998
    }
}
