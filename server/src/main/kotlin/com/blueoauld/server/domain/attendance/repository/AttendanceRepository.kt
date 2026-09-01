package com.blueoauld.server.domain.attendance.repository

import com.blueoauld.server.domain.attendance.entity.Attendance
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface AttendanceRepository : JpaRepository<Attendance, Long> {

    fun existsByPhoneNumberAndAttendedOn(phoneNumber: String, attendedOn: LocalDate): Boolean

    fun findAllByMemberIdAndAttendedOnGreaterThanEqualOrderByAttendedOn(
        memberId: Long,
        from: LocalDate,
    ): List<Attendance>

    @Modifying
    @Query("delete from Attendance a where a.attendedOn < :threshold")
    fun deleteAllAttendedBefore(@Param("threshold") threshold: LocalDate): Int
}
