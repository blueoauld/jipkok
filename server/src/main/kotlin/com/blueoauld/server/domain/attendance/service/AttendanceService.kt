package com.blueoauld.server.domain.attendance.service

import com.blueoauld.server.domain.attendance.dto.response.AttendanceResponse
import com.blueoauld.server.domain.attendance.entity.Attendance
import com.blueoauld.server.domain.attendance.repository.AttendanceRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

@Service
class AttendanceService(

    private val attendanceRepository: AttendanceRepository,
    private val memberRepository: MemberRepository,
    private val pointService: PointService,
    private val clock: Clock,
) {

    @Transactional
    fun checkIn(memberId: Long): AttendanceResponse {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }
        val today = today()

        if (attendanceRepository.existsByPhoneNumberAndAttendedOn(member.phoneNumber, today)) {
            return AttendanceResponse(earned = false, amount = 0, balance = member.pointBalance)
        }

        attendanceRepository.saveAndFlush(Attendance(member.phoneNumber, memberId, today))
        val reward = pointService.earn(memberId, PointType.ATTENDANCE_REWARD)

        return AttendanceResponse(earned = reward.earned, amount = reward.amount, balance = reward.balance)
    }

    private fun today() = LocalDate.now(clock.withZone(KOREA))

    companion object {

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
