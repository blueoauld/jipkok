package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.event.MemberTextBlockedEvent
import com.blueoauld.server.global.discord.ConditionalOnDiscord
import com.blueoauld.server.global.discord.DiscordBot
import com.blueoauld.server.global.discord.DiscordEmbeds
import com.blueoauld.server.global.properties.DiscordProperties
import net.dv8tion.jda.api.entities.MessageEmbed
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
@ConditionalOnDiscord
class ModerationNotifier(

    private val discordBot: DiscordBot,
    private val discordProperties: DiscordProperties,
) {

    @EventListener
    fun notifyBlocked(event: MemberTextBlockedEvent) {
        discordBot.send(discordProperties.moderationChannelId, toEmbeds(event))
    }

    private fun toEmbeds(event: MemberTextBlockedEvent): List<MessageEmbed> {
        val body = listOf(
            DiscordEmbeds.field("회원", "${event.nickname}(`${event.memberId}`)"),
            DiscordEmbeds.field("항목", event.field),
            DiscordEmbeds.field("분류", event.category.label),
            DiscordEmbeds.field("내용", event.text),
        ).joinToString("\n\n")

        return DiscordEmbeds.of(TITLE, body)
    }

    companion object {

        private const val TITLE = "검수"
    }
}
