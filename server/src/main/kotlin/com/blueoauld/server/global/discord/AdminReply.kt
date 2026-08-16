package com.blueoauld.server.global.discord

import net.dv8tion.jda.api.entities.MessageEmbed
import net.dv8tion.jda.api.utils.FileUpload

sealed interface AdminReply {

    data class Text(val message: String) : AdminReply

    data class Embeds(val embeds: List<MessageEmbed>, val file: FileUpload? = null) : AdminReply

    companion object {

        fun of(title: String, body: String, file: FileUpload? = null) = Embeds(DiscordEmbeds.of(title, body), file)
    }
}
