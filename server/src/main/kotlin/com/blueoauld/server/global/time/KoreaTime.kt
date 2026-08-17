package com.blueoauld.server.global.time

import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

val KOREA: ZoneId = ZoneId.of("Asia/Seoul")

fun Clock.today(): LocalDate = LocalDate.now(withZone(KOREA))

fun Clock.currentYear(): Int = today().year
