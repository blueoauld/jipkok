package com.blueoauld.server.domain.admin.dto.response

import java.time.LocalDate

data class TrendPointResponse(

    val date: LocalDate,
    val signups: Long,
    val withdrawals: Long,
    val reports: Long,
)
