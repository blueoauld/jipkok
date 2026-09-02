package com.blueoauld.server.domain.attendance.service

import com.blueoauld.server.domain.attendance.dto.response.AttendanceDaysResponse
import com.blueoauld.server.domain.attendance.entity.Attendance
import com.blueoauld.server.domain.attendance.repository.AttendanceRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.*

class AttendanceServiceTest {

    private val attendanceRepository = mockk<AttendanceRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>()

    private val pointService = mockk<PointService>(relaxed = true)

    private val attendanceService = AttendanceService(
        attendanceRepository,
        memberRepository,
        pointService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { attendanceRepository.existsByPhoneNumberAndAttendedOn(any(), any()) } returns false
        every { attendanceRepository.saveAndFlush(any()) } answers { firstArg() }
        every { pointService.earn(any(), any()) } returns PointRewardResponse(true, 30, 130)
    }

    @Test
    fun `출석하면 휴대폰 번호로 기록하고 보상을 준다`() {
        // given
        val saved = slot<Attendance>()

        // when
        val response = attendanceService.checkIn(MEMBER_ID)

        // then
        verify { attendanceRepository.saveAndFlush(capture(saved)) }
        verify { pointService.earn(MEMBER_ID, PointType.ATTENDANCE_REWARD) }
        assertThat(saved.captured.phoneNumber).isEqualTo(PHONE_NUMBER)
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
        assertThat(response.earned).isTrue()
        assertThat(response.amount).isEqualTo(30)
        assertThat(response.balance).isEqualTo(130)
    }

    @Test
    fun `같은 번호로 오늘 이미 출석했으면 보상을 주지 않는다`() {
        // given
        every {
            attendanceRepository.existsByPhoneNumberAndAttendedOn(PHONE_NUMBER, TODAY)
        } returns true

        // when
        val response = attendanceService.checkIn(MEMBER_ID)

        // then
        verify(exactly = 0) { attendanceRepository.saveAndFlush(any()) }
        verify(exactly = 0) { pointService.earn(any(), any()) }
        assertThat(response.earned).isFalse()
        assertThat(response.amount).isEqualTo(0)
        assertThat(response.balance).isEqualTo(POINT_BALANCE)
    }

    @Test
    fun `출석 날짜는 한국 시간을 따른다`() {
        // given
        val saved = slot<Attendance>()

        // when
        attendanceService.checkIn(MEMBER_ID)

        // then
        verify { attendanceRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.attendedOn).isEqualTo(LocalDate.of(2026, 8, 2))
    }

    @Test
    fun `회원이 없으면 출석에 실패한다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            attendanceService.checkIn(MEMBER_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { attendanceRepository.saveAndFlush(any()) }
    }

    @Test
    fun `최근 91일의 출석 날짜를 오늘 기준과 함께 준다`() {
        // given
        val today = LocalDate.of(2026, 8, 2)
        val from = today.minusDays(90)
        every {
            attendanceRepository.findAllByMemberIdAndAttendedOnGreaterThanEqualOrderByAttendedOn(MEMBER_ID, from)
        } returns listOf(
            Attendance("+821011112222", MEMBER_ID, from),
            Attendance("+821011112222", MEMBER_ID, today),
        )

        // when
        val response = attendanceService.findDays(MEMBER_ID)

        // then
        assertThat(response).isEqualTo(AttendanceDaysResponse(today = today, days = listOf(from, today)))
    }

    private fun member() = Member(
        phoneNumber = PHONE_NUMBER,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "닉네임",
        birthYear = 1998,
    ).apply { pointBalance = POINT_BALANCE }

    companion object {

        private const val MEMBER_ID = 1L
        private const val PHONE_NUMBER = "+821012345678"
        private const val POINT_BALANCE = 200

        private val NOW: Instant = Instant.parse("2026-08-01T16:00:00Z")

        private val TODAY: LocalDate = LocalDate.of(2026, 8, 2)
    }
}
