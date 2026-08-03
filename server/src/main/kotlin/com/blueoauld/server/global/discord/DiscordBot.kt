package com.blueoauld.server.global.discord

import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.annotation.PreDestroy
import net.dv8tion.jda.api.JDA
import net.dv8tion.jda.api.JDABuilder
import net.dv8tion.jda.api.entities.MessageEmbed
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${discord.token:}'.isEmpty()")
class DiscordBot(

    private val discordProperties: DiscordProperties,
    adminCommandListener: AdminCommandListener,
) {

    private val jda: JDA = JDABuilder.createLight(discordProperties.token)
        .addEventListeners(adminCommandListener)
        .build()

    init {
        jda.awaitReady()
        jda.getGuildById(discordProperties.guildId)
            ?.updateCommands()
            ?.addCommands(AdminCommandListener.commands())
            ?.queue()
            ?: log.error { "디스코드 길드를 찾지 못했다. guildId=${discordProperties.guildId}" }
    }

    fun send(channelId: String, embeds: List<MessageEmbed>) {
        jda.getTextChannelById(channelId)
            ?.sendMessageEmbeds(embeds)
            ?.queue()
            ?: log.error { "채널을 찾지 못했다. channelId=$channelId" }
    }

    @PreDestroy
    fun shutdown() {
        jda.shutdown()
    }
}
