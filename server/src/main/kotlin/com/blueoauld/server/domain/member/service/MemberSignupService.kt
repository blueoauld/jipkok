package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.auth.dto.response.TokenResponse
import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import com.blueoauld.server.domain.auth.service.AuthService
import com.blueoauld.server.domain.auth.service.VerificationCodeService
import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.security.checkPasswordBytes
import com.blueoauld.server.global.security.checkPasswordConfirm
import com.blueoauld.server.global.security.encodePassword
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberSignupService(

    private val memberRepository: MemberRepository,
    private val nicknameHistoryRepository: NicknameHistoryRepository,
    private val verificationCodeService: VerificationCodeService,
    private val authService: AuthService,
    private val passwordEncoder: PasswordEncoder,
    private val memberSuspensionService: MemberSuspensionService,
) {

    @Transactional
    fun signup(request: SignupRequest): TokenResponse {
        checkPasswordConfirm(request.password, request.passwordConfirm)
        checkPasswordBytes(request.password)

        verificationCodeService.verify(
            request.phoneNumber,
            request.verificationCode,
            VerificationPurpose.SIGNUP,
        )

        if (memberRepository.existsByPhoneNumber(request.phoneNumber)) {
            throw BusinessException(ErrorCode.DUPLICATE_PHONE_NUMBER)
        }

        memberSuspensionService.checkPhoneNumber(request.phoneNumber, SuspensionType.SERVICE)

        val member = memberRepository.save(
            Member(
                phoneNumber = request.phoneNumber,
                password = passwordEncoder.encodePassword(request.password),
                gender = request.gender,
                nickname = Member.generateNickname(),
                birthYear = DEFAULT_BIRTH_YEAR,
            ),
        )
        nicknameHistoryRepository.save(NicknameHistory(member.id, member.nickname))

        return authService.issueTokens(member)
    }

    companion object {

        const val DEFAULT_BIRTH_YEAR = 1998
    }
}
