package com.blueoauld.server.domain.attendance.dto.response

data class AttendanceResponse(

    val earned: Boolean,
    val amount: Int,
    val balance: Int,
)
