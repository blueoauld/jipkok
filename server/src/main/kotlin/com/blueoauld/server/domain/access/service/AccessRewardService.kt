package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.dto.AccessInfo
import com.blueoauld.server.domain.access.entity.AccessReward
import com.blueoauld.server.domain.access.repository.AccessRewardRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

@Service
class AccessRewardService(

    private val accessRewardRepository: AccessRewardRepository,
    private val pointService: PointService,
    private val clock: Clock,
) {

    @Transactional
    fun earn(member: Member, access: AccessInfo): PointRewardResponse {
        val today = today()

        if (accessRewardRepository.existsByPhoneNumberAndAccessedOn(member.phoneNumber, today)) {
            return PointRewardResponse(earned = false, amount = 0, balance = member.pointBalance)
        }

        accessRewardRepository.saveAndFlush(
            AccessReward(
                phoneNumber = member.phoneNumber,
                memberId = member.id,
                platform = access.platform,
                deviceName = access.deviceName,
                ipAddress = access.ipAddress,
                accessedOn = today,
            ),
        )

        return pointService.earn(member.id, PointType.ACCESS_REWARD)
    }

    private fun today() = LocalDate.now(clock.withZone(KOREA))

    companion object {

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
