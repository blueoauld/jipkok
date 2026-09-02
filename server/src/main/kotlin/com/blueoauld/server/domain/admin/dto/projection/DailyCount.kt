package com.blueoauld.server.domain.admin.dto.projection

import java.time.LocalDate

interface DailyCount {

    val day: LocalDate
    val count: Long
}
