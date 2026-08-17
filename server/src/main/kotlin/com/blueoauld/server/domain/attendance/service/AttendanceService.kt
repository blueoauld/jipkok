package com.blueoauld.server.domain.attendance.service

import com.blueoauld.server.domain.attendance.entity.Attendance
import com.blueoauld.server.domain.attendance.repository.AttendanceRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
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
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }
        val today = clock.today()

        if (attendanceRepository.existsByPhoneNumberAndAttendedOn(member.phoneNumber, today)) {
            return PointRewardResponse(earned = false, amount = 0, balance = member.pointBalance)
        }

        attendanceRepository.saveAndFlush(Attendance(member.phoneNumber, memberId, today))
        return pointService.earn(memberId, PointType.ATTENDANCE_REWARD)
    }
}
