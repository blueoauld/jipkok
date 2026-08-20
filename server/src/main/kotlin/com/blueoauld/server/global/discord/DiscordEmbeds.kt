package com.blueoauld.server.global.discord

import com.blueoauld.server.global.time.KOREA
import net.dv8tion.jda.api.EmbedBuilder
import net.dv8tion.jda.api.entities.MessageEmbed
import java.time.Instant
import java.time.format.DateTimeFormatter

object DiscordEmbeds {

    const val DESCRIPTION_MAX_LENGTH = 4096

    private val FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")

    private val SECOND_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")

    fun format(instant: Instant): String = FORMATTER.format(instant.atZone(KOREA))

    fun formatSecond(instant: Instant): String = SECOND_FORMATTER.format(instant.atZone(KOREA))

    fun of(title: String, body: String): List<MessageEmbed> =
        chunk(body, DESCRIPTION_MAX_LENGTH).mapIndexed { index, chunk ->
            EmbedBuilder()
                .apply { if (index == 0) setTitle(title) }
                .setDescription(chunk)
                .build()
        }

    fun field(label: String, value: String) = "**$label**\n$value"

    private fun chunk(text: String, maxLength: Int) =
        text.lineSequence().fold(mutableListOf<String>()) { chunks, line ->
            val last = chunks.lastOrNull()

            if (last == null || last.length + line.length + 1 > maxLength) {
                chunks.add(line)
            } else {
                chunks[chunks.lastIndex] = "$last\n$line"
            }

            chunks
        }
}
