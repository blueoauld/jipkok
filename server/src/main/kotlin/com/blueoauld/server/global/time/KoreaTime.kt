package com.blueoauld.server.global.time

import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

const val KOREA_ID = "Asia/Seoul"

val KOREA: ZoneId = ZoneId.of(KOREA_ID)

fun Clock.today(): LocalDate = LocalDate.now(withZone(KOREA))

fun Instant.koreaDate(): LocalDate = atZone(KOREA).toLocalDate()

fun Clock.currentYear(): Int = today().year

fun Clock.ageOf(birthYear: Int): Int = currentYear() - birthYear
