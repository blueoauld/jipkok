package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.request.ResetPasswordRequest
import com.blueoauld.server.domain.auth.entity.type.VerificationPurpose
import com.blueoauld.server.domain.auth.repository.LoginAttemptCache
import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.service.DeviceTokenService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.security.checkPasswordConfirm
import com.blueoauld.server.global.security.encodePassword
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
    private val deviceTokenService: DeviceTokenService,
) {

    @Transactional
    fun reset(request: ResetPasswordRequest) {
        checkPasswordConfirm(request.password, request.passwordConfirm)

        verificationCodeService.verify(
            request.phoneNumber,
            request.verificationCode,
            VerificationPurpose.PASSWORD_RESET,
        )

        val member = memberRepository.findByPhoneNumber(request.phoneNumber)
            ?: throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)

        member.password = passwordEncoder.encodePassword(request.password)

        refreshTokenRepository.delete(member.id)
        deviceTokenService.removeAll(member.id)
        loginAttemptCache.clear(request.phoneNumber)
    }
}
