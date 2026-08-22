package com.blueoauld.server.domain.push.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.dto.request.RegisterDeviceTokenRequest
import com.blueoauld.server.domain.push.entity.DeviceToken
import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class DeviceTokenService(

    private val deviceTokenRepository: DeviceTokenRepository,
    private val memberRepository: MemberRepository,
) {

    @Transactional
    fun register(memberId: Long, request: RegisterDeviceTokenRequest) {
        applyLocale(memberId, request.locale)

        val token = deviceTokenRepository.findByToken(request.token)

        if (token == null) {
            deviceTokenRepository.save(DeviceToken(memberId, request.token, request.platform))
            return
        }

        token.memberId = memberId
        token.platform = request.platform
    }

    private fun applyLocale(memberId: Long, locale: MemberLocale?) {
        if (locale == null) {
            return
        }

        memberRepository.findById(memberId).ifPresent {
            if (it.locale != locale) {
                it.locale = locale
            }
        }
    }

    @Transactional
    fun remove(token: String) {
        deviceTokenRepository.deleteByToken(token)
    }

    @Transactional(readOnly = true)
    fun findTokens(memberId: Long) = deviceTokenRepository.findAllByMemberId(memberId).map { it.token }

    @Transactional(readOnly = true)
    fun findTokens(memberIds: List<Long>) = deviceTokenRepository.findAllByMemberIdIn(memberIds).map { it.token }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun removeExpired(tokens: List<String>) {
        if (tokens.isNotEmpty()) {
            deviceTokenRepository.deleteAllByTokenIn(tokens)
        }
    }
}
