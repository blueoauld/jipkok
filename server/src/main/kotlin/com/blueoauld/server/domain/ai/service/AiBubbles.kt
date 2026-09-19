package com.blueoauld.server.domain.ai.service

private const val MAX_BUBBLES = 3

private val BUBBLE_BREAK = Regex("(?<=[.?!…])\\s+|\\n+")
private val TRAILING_PERIOD = Regex("(?<!\\.)\\.$")

fun splitBubbles(text: String): List<String> {
    val sentences = text.split(BUBBLE_BREAK)
        .map { it.trim().replace(TRAILING_PERIOD, "").trimEnd() }
        .filter { it.isNotBlank() }

    if (sentences.isEmpty()) {
        return listOf(text.trim())
    }

    val head = sentences.take(MAX_BUBBLES - 1)
    val tail = sentences.drop(MAX_BUBBLES - 1)

    return if (tail.isEmpty()) head else head + tail.joinToString(" ")
}
