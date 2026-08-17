package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.dto.AccessInfo
import com.blueoauld.server.domain.access.repository.AccessLogRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AccessLogServiceTest {

    private val accessLogRepository = mockk<AccessLogRepository>(relaxed = true)

    private val service = AccessLogService(accessLogRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @Test
    fun `한국 날짜 기준으로 접속 기록을 남긴다`() {
        // given
        val member = Member(
            phoneNumber = "01012345678",
            password = "encoded",
            gender = Gender.MALE,
            nickname = "회원",
            birthYear = 1998,
        )

        // when
        service.record(member, AccessInfo(DevicePlatform.IOS, "iPhone", "1.2.3.4"))

        // then
        verify {
            accessLogRepository.insertIfAbsent(
                memberId = member.id,
                phoneNumber = "01012345678",
                platform = "IOS",
                deviceName = "iPhone",
                ipAddress = "1.2.3.4",
                accessedOn = LocalDate.of(2026, 8, 2),
                now = NOW,
            )
        }
    }

    companion object {

        // UTC 1일 20시는 한국 2일 5시다.
        private val NOW: Instant = Instant.parse("2026-08-01T20:00:00Z")
    }
}
