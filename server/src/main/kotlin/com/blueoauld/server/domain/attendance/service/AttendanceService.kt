package com.blueoauld.server.domain.attendance.service

import com.blueoauld.server.domain.attendance.dto.response.AttendanceDaysResponse
import com.blueoauld.server.domain.attendance.entity.Attendance
import com.blueoauld.server.domain.attendance.repository.AttendanceRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.time.today
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class AttendanceService(

    private val attendanceRepository: AttendanceRepository,
    private val memberRepository: MemberRepository,
    private val pointService: PointService,
    private val clock: Clock,
) {

    @Transactional
    fun checkIn(memberId: Long): PointRewardResponse {
        val member = memberRepository.getMember(memberId)
        val today = clock.today()

        if (attendanceRepository.existsByPhoneNumberAndAttendedOn(member.phoneNumber, today)) {
            return PointRewardResponse(earned = false, amount = 0, balance = member.pointBalance)
        }

        attendanceRepository.saveAndFlush(Attendance(member.phoneNumber, memberId, today))
        return pointService.earn(memberId, PointType.ATTENDANCE_REWARD)
    }

    @Transactional(readOnly = true)
    fun findDays(memberId: Long): AttendanceDaysResponse {
        val today = clock.today()
        val from = today.minusDays(GRASS_DAYS - 1L)

        return AttendanceDaysResponse(
            today = today,
            days = attendanceRepository
                .findAllByMemberIdAndAttendedOnGreaterThanEqualOrderByAttendedOn(memberId, from)
                .map { it.attendedOn },
        )
    }

    companion object {

        const val GRASS_DAYS = 91
    }
}
