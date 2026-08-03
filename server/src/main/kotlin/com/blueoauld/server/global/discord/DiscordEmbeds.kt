package com.blueoauld.server.global.discord

import net.dv8tion.jda.api.EmbedBuilder
import net.dv8tion.jda.api.entities.MessageEmbed

object DiscordEmbeds {

    const val DESCRIPTION_MAX_LENGTH = 4096

    fun of(title: String, body: String): List<MessageEmbed> =
        chunk(body, DESCRIPTION_MAX_LENGTH).mapIndexed { index, chunk ->
            EmbedBuilder()
                .apply { if (index == 0) setTitle(title) }
                .setDescription(chunk)
                .build()
        }

    fun field(label: String, value: String) = "**$label**\n$value"

    fun chunk(text: String, maxLength: Int) =
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
