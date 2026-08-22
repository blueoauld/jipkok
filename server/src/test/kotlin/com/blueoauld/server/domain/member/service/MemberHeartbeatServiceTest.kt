package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.access.service.AccessLogService
import com.blueoauld.server.domain.access.service.AccessRewardService
import com.blueoauld.server.domain.member.dto.request.HeartbeatRequest
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class MemberHeartbeatServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val accessLogService = mockk<AccessLogService>(relaxed = true)

    private val accessRewardService = mockk<AccessRewardService>(relaxed = true)

    private val memberHeartbeatService = MemberHeartbeatService(
        memberRepository,
        accessLogService,
        accessRewardService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `좌표를 보내면 위치와 시각이 갱신된다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberHeartbeatService.heartbeat(MEMBER_ID, heartbeat(37.5665, 126.9780), IP_ADDRESS, APP_VERSION)

        // then
        assertThat(member.latitude).isEqualTo(37.5665)
        assertThat(member.longitude).isEqualTo(126.9780)
        assertThat(member.locatedAt).isEqualTo(NOW)
    }

    @Test
    fun `좌표 없이 보내면 기존 좌표를 지우고 시각만 갱신한다`() {
        // given
        val member = member()
        member.latitude = 37.5665
        member.longitude = 126.9780
        stubMember(member)

        // when
        memberHeartbeatService.heartbeat(MEMBER_ID, heartbeat(), IP_ADDRESS, APP_VERSION)

        // then
        assertThat(member.latitude).isNull()
        assertThat(member.longitude).isNull()
        assertThat(member.locatedAt).isEqualTo(NOW)
    }

    @Test
    fun `좌표를 하나만 보내면 실패한다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberHeartbeatService.heartbeat(MEMBER_ID, heartbeat(latitude = 37.5665), IP_ADDRESS, APP_VERSION)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_LOCATION)
        assertThat(member.locatedAt).isNull()
    }

    @Test
    fun `없는 회원이면 위치 갱신에 실패한다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            memberHeartbeatService.heartbeat(MEMBER_ID, heartbeat(37.5665, 126.9780), IP_ADDRESS, APP_VERSION)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
    }

    @Test
    fun `하트비트마다 접속 기록을 남긴다`() {
        // given
        val member = member()
        stubMember(member)

        // when
        memberHeartbeatService.heartbeat(MEMBER_ID, heartbeat(37.5665, 126.9780), IP_ADDRESS, APP_VERSION)

        // then
        verify { accessLogService.record(member, any()) }
    }

    private fun heartbeat(latitude: Double? = null, longitude: Double? = null) =
        HeartbeatRequest(DevicePlatform.IOS, "iPhone 15 Pro", latitude, longitude)

    private fun member() = Member(
        phoneNumber = PHONE_NUMBER,
        password = ENCODED_PASSWORD,
        gender = Gender.MALE,
        nickname = "default000",
        birthYear = MemberSignupService.DEFAULT_BIRTH_YEAR,
    )

    private fun stubMember(member: Member) {
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { memberRepository.existsByNicknameIgnoreCase(any()) } returns false
    }

    companion object {

        private const val IP_ADDRESS = "203.0.113.7"
        private const val APP_VERSION = "1.8.2"
        private const val PHONE_NUMBER = "+821012345678"
        private const val ENCODED_PASSWORD = "encoded-password"
        private const val MEMBER_ID = 0L
        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
