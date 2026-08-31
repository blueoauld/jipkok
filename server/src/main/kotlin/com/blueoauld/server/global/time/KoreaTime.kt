package com.blueoauld.server.global.time

import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

const val KOREA_ID = "Asia/Seoul"

val KOREA: ZoneId = ZoneId.of(KOREA_ID)

fun Clock.today(): LocalDate = LocalDate.now(withZone(KOREA))

fun Clock.currentYear(): Int = today().year
