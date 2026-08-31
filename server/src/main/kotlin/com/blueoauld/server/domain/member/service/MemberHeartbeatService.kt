package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.access.dto.AccessInfo
import com.blueoauld.server.domain.access.service.AccessLogService
import com.blueoauld.server.domain.access.service.AccessRewardService
import com.blueoauld.server.domain.member.dto.request.HeartbeatRequest
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class MemberHeartbeatService(

    private val memberRepository: MemberRepository,
    private val accessLogService: AccessLogService,
    private val accessRewardService: AccessRewardService,
    private val clock: Clock,
) {

    @Transactional
    fun heartbeat(
        memberId: Long,
        request: HeartbeatRequest,
        ipAddress: String,
        appVersion: String?,
    ): PointRewardResponse {
        val member = memberRepository.getMember(memberId)

        if ((request.latitude == null) != (request.longitude == null)) {
            throw BusinessException(ErrorCode.INVALID_LOCATION)
        }

        member.latitude = request.latitude
        member.longitude = request.longitude
        member.locatedAt = clock.instant()

        val platform = request.platform ?: throw BusinessException(ErrorCode.INVALID_REQUEST)

        val access = AccessInfo(platform, request.deviceName, ipAddress, appVersion)

        accessLogService.record(member, access)

        return accessRewardService.earn(member, access)
    }
}
