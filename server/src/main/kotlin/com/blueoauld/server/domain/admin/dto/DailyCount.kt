package com.blueoauld.server.domain.admin.dto

import java.time.LocalDate

interface DailyCount {

    val day: LocalDate
    val count: Long
}
