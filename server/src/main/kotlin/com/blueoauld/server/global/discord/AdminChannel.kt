package com.blueoauld.server.global.discord

import io.github.oshai.kotlinlogging.KotlinLogging
import net.dv8tion.jda.api.entities.MessageEmbed
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent

private val log = KotlinLogging.logger {}

fun SlashCommandInteractionEvent.sendTo(channelId: String, embed: MessageEmbed) {
    jda.getTextChannelById(channelId)
        ?.sendMessageEmbeds(embed)
        ?.queue()
        ?: log.error { "채널을 찾지 못했다. channelId=$channelId" }
}
