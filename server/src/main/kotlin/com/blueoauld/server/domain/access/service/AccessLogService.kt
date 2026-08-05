package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.dto.AccessInfo
import com.blueoauld.server.domain.access.repository.AccessLogRepository
import com.blueoauld.server.domain.member.entity.Member
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

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
            accessedOn = LocalDate.now(clock.withZone(KOREA)),
            now = clock.instant(),
        )
    }

    companion object {

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
