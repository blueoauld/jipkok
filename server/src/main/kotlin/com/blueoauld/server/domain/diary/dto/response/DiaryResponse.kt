package com.blueoauld.server.domain.diary.dto.response

import java.time.Instant
import java.time.LocalDate

data class DiaryResponse(

    val entryDate: LocalDate,
    val content: String,
    val updatedAt: Instant,
)
