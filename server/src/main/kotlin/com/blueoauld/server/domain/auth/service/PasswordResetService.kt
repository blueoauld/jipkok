package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.request.ResetPasswordRequest
import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import com.blueoauld.server.domain.auth.repository.LoginAttemptCache
import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PasswordResetService(

    private val memberRepository: MemberRepository,
    private val verificationCodeService: VerificationCodeService,
    private val passwordEncoder: PasswordEncoder,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val loginAttemptCache: LoginAttemptCache,
) {

    @Transactional
    fun reset(request: ResetPasswordRequest) {
        if (request.password != request.passwordConfirm) {
            throw BusinessException(ErrorCode.PASSWORD_CONFIRM_MISMATCH)
        }

        verificationCodeService.verify(
            request.phoneNumber,
            request.verificationCode,
            VerificationPurpose.PASSWORD_RESET,
        )

        val member = memberRepository.findByPhoneNumber(request.phoneNumber)
            ?: throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)

        member.password = checkNotNull(passwordEncoder.encode(request.password)) {
            "비밀번호를 암호화하지 못했다."
        }

        refreshTokenRepository.delete(member.id)
        loginAttemptCache.clear(request.phoneNumber)
    }
}
