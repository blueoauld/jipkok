package com.blueoauld.server.domain.ai.service

private val AWAY_MARKER = Regex("""\[자리 비움 (\d+)분?]""")

fun awayMinutesOf(text: String): Long? = AWAY_MARKER.find(text)?.groupValues?.get(1)?.toLongOrNull()

fun removeAwayMarker(text: String): String = AWAY_MARKER.replace(text, "").trim()
