package com.blueoauld.server.global.discord

import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.annotation.PreDestroy
import net.dv8tion.jda.api.JDA
import net.dv8tion.jda.api.JDABuilder
import net.dv8tion.jda.api.entities.MessageEmbed
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnDiscord
class DiscordBot(

    discordProperties: DiscordProperties,
) {

    private val jda: JDA = JDABuilder.createLight(discordProperties.token).build()

    fun send(channelId: String, embeds: List<MessageEmbed>) {
        runCatching {
            jda.getTextChannelById(channelId)
                ?.sendMessageEmbeds(embeds)
                ?.queue()
                ?: log.error { "채널을 찾지 못했다. channelId=$channelId, status=${jda.status}" }
        }.onFailure { log.error(it) { "알림을 보내지 못했다. title=${embeds.firstOrNull()?.title}" } }
    }

    @PreDestroy
    fun shutdown() {
        jda.shutdown()
    }
}
