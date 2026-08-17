package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.dto.AccessInfo
import com.blueoauld.server.domain.access.repository.AccessLogRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.global.time.today
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class AccessLogService(

    private val accessLogRepository: AccessLogRepository,
    private val clock: Clock,
) {

    @Transactional
    fun record(member: Member, access: AccessInfo) {
        accessLogRepository.insertIfAbsent(
            memberId = member.id,
            phoneNumber = member.phoneNumber,
            platform = access.platform.name,
            deviceName = access.deviceName,
            ipAddress = access.ipAddress,
            accessedOn = clock.today(),
            now = clock.instant(),
        )
    }
}
