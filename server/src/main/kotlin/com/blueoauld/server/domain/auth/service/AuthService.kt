package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.request.LoginRequest
import com.blueoauld.server.domain.auth.dto.request.RefreshTokenRequest
import com.blueoauld.server.domain.auth.dto.response.TokenResponse
import com.blueoauld.server.domain.auth.repository.LoginAttemptCache
import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.service.DeviceTokenService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.security.AccessTokenRevocationCache
import com.blueoauld.server.global.security.JwtProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class AuthService(

    private val memberRepository: MemberRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val loginAttemptCache: LoginAttemptCache,
    private val deviceTokenService: DeviceTokenService,
    private val accessTokenRevocationCache: AccessTokenRevocationCache,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider,
) {

    fun login(request: LoginRequest, ipAddress: String): TokenResponse {
        checkAttempts(request.phoneNumber, ipAddress)

        val member = memberRepository.findByPhoneNumber(request.phoneNumber)

        if (member == null || !passwordEncoder.matches(request.password, member.password)) {
            loginAttemptCache.increase(request.phoneNumber, ipAddress)
            throw BusinessException(ErrorCode.LOGIN_FAILED)
        }

        loginAttemptCache.clear(request.phoneNumber)
        deviceTokenService.removeAll(member.id)
        accessTokenRevocationCache.revokeAll(member.id)

        return issueTokens(member)
    }

    private fun checkAttempts(phoneNumber: String, ipAddress: String) {
        val count = loginAttemptCache.find(phoneNumber, ipAddress)

        if (count.phoneNumber >= PHONE_NUMBER_ATTEMPT_LIMIT || count.ipAddress >= IP_ADDRESS_ATTEMPT_LIMIT) {
            throw BusinessException(ErrorCode.LOGIN_ATTEMPT_EXCEEDED)
        }
    }

    fun reissue(request: RefreshTokenRequest): TokenResponse {
        val memberId = jwtProvider.parseRefreshTokenMemberId(request.refreshToken)
            ?: throw BusinessException(ErrorCode.INVALID_REFRESH_TOKEN)

        val storedToken = refreshTokenRepository.findToken(memberId)
            ?: throw BusinessException(ErrorCode.INVALID_REFRESH_TOKEN)

        if (storedToken != request.refreshToken) {
            throw BusinessException(ErrorCode.INVALID_REFRESH_TOKEN)
        }

        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.INVALID_REFRESH_TOKEN)
        }

        return issueTokens(member)
    }

    fun logout(refreshToken: String) {
        jwtProvider.parseRefreshTokenMemberId(refreshToken)?.let(refreshTokenRepository::delete)
    }

    fun issueTokens(member: Member): TokenResponse {
        val refreshToken = jwtProvider.createRefreshToken(member.id)
        refreshTokenRepository.save(member.id, refreshToken)

        return TokenResponse(jwtProvider.createAccessToken(member.id, member.role.name), refreshToken)
    }

    companion object {

        const val PHONE_NUMBER_ATTEMPT_LIMIT = 5
        const val IP_ADDRESS_ATTEMPT_LIMIT = 30
    }
}
