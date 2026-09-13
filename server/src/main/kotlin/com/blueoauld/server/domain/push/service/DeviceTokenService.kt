package com.blueoauld.server.domain.push.service

import com.blueoauld.server.domain.member.service.MemberService
import com.blueoauld.server.domain.push.dto.request.RegisterDeviceTokenRequest
import com.blueoauld.server.domain.push.entity.DeviceToken
import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class DeviceTokenService(

    private val deviceTokenRepository: DeviceTokenRepository,
    private val memberService: MemberService,
) {

    @Transactional
    fun register(memberId: Long, request: RegisterDeviceTokenRequest) {
        request.locale?.let { memberService.updateLocale(memberId, it) }

        val token = deviceTokenRepository.findByToken(request.token)

        if (token == null) {
            deviceTokenRepository.save(DeviceToken(memberId, request.token, request.platform))
            return
        }

        token.memberId = memberId
        token.platform = request.platform
    }

    @Transactional
    fun remove(memberId: Long, token: String) {
        deviceTokenRepository.deleteByTokenAndMemberId(token, memberId)
    }

    @Transactional
    fun removeAll(memberId: Long) {
        deviceTokenRepository.deleteAllByMemberId(memberId)
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
