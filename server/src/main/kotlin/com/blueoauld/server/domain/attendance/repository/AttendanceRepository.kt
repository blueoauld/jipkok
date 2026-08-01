package com.blueoauld.server.domain.attendance.repository

import com.blueoauld.server.domain.attendance.entity.Attendance
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface AttendanceRepository : JpaRepository<Attendance, Long> {

    fun existsByPhoneNumberAndAttendedOn(phoneNumber: String, attendedOn: LocalDate): Boolean
}
