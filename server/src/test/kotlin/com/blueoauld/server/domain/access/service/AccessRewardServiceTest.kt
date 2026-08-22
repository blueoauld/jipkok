package com.blueoauld.server.domain.access.service

import com.blueoauld.server.domain.access.dto.AccessInfo
import com.blueoauld.server.domain.access.entity.AccessReward
import com.blueoauld.server.domain.access.repository.AccessRewardRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class AccessRewardServiceTest {

    private val accessRewardRepository = mockk<AccessRewardRepository>(relaxed = true)

    private val pointService = mockk<PointService>(relaxed = true)

    private val accessRewardService = AccessRewardService(
        accessRewardRepository,
        pointService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    private val member = Member(
        phoneNumber = PHONE_NUMBER,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "홍길동",
        birthYear = 1998,
        pointBalance = BALANCE,
    )

    @BeforeEach
    fun setUp() {
        every { accessRewardRepository.existsByPhoneNumberAndAccessedOn(any(), any()) } returns false
        every { accessRewardRepository.saveAndFlush(any()) } answers { firstArg() }
        every { pointService.earn(any(), any()) } returns PointRewardResponse(true, AMOUNT, BALANCE + AMOUNT)
    }

    @Test
    fun `기기와 아이피를 남기고 보상을 준다`() {
        // given
        val saved = slot<AccessReward>()

        // when
        val response = accessRewardService.earn(member, ACCESS)

        // then
        verify { accessRewardRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.phoneNumber).isEqualTo(PHONE_NUMBER)
        assertThat(saved.captured.platform).isEqualTo(DevicePlatform.IOS)
        assertThat(saved.captured.deviceName).isEqualTo(DEVICE_NAME)
        assertThat(saved.captured.ipAddress).isEqualTo(IP_ADDRESS)
        assertThat(saved.captured.accessedOn).isEqualTo(TODAY)

        verify { pointService.earn(member.id, PointType.ACCESS_REWARD) }
        assertThat(response.earned).isTrue()
    }

    @Test
    fun `오늘 이미 받았으면 주지 않는다`() {
        // given
        every { accessRewardRepository.existsByPhoneNumberAndAccessedOn(PHONE_NUMBER, TODAY) } returns true

        // when
        val response = accessRewardService.earn(member, ACCESS)

        // then
        assertThat(response.earned).isFalse()
        assertThat(response.balance).isEqualTo(BALANCE)
        verify(exactly = 0) { accessRewardRepository.saveAndFlush(any()) }
        verify(exactly = 0) { pointService.earn(any(), any()) }
    }

    companion object {

        private const val PHONE_NUMBER = "+821011112222"
        private const val DEVICE_NAME = "iPhone 15 Pro"
        private const val IP_ADDRESS = "203.0.113.7"

        private const val BALANCE = 100
        private const val AMOUNT = 30

        private val NOW: Instant = Instant.parse("2026-08-03T05:00:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 8, 3)

        private val ACCESS = AccessInfo(DevicePlatform.IOS, DEVICE_NAME, IP_ADDRESS, null)
    }
}
