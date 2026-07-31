package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.dto.request.LoginRequest
import com.blueoauld.server.domain.auth.dto.request.ReissueRequest
import com.blueoauld.server.domain.auth.dto.response.TokenResponse
import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.security.JwtProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(

    private val memberRepository: MemberRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider,
) {

    @Transactional(readOnly = true)
    fun login(request: LoginRequest): TokenResponse {
        val member = memberRepository.findByPhoneNumber(request.phoneNumber)
            ?: throw BusinessException(ErrorCode.LOGIN_FAILED)

        if (!passwordEncoder.matches(request.password, member.password)) {
            throw BusinessException(ErrorCode.LOGIN_FAILED)
        }

        return issueTokens(member)
    }

    @Transactional(readOnly = true)
    fun reissue(request: ReissueRequest): TokenResponse {
        val memberId = jwtProvider.parseRefreshTokenMemberId(request.refreshToken)
            ?: throw BusinessException(ErrorCode.INVALID_REFRESH_TOKEN)

        val storedToken = refreshTokenRepository.findToken(memberId)
            ?: throw BusinessException(ErrorCode.INVALID_REFRESH_TOKEN)

        if (storedToken != request.refreshToken) {
            refreshTokenRepository.delete(memberId)
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
}
