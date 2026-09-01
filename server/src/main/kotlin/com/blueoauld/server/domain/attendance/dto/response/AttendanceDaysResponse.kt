package com.blueoauld.server.domain.attendance.dto.response

import java.time.LocalDate

data class AttendanceDaysResponse(

    val today: LocalDate,
    val days: List<LocalDate>,
)
