package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.member.event.MemberTextBlockedEvent
import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import net.dv8tion.jda.api.entities.MessageEmbed
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${discord.token:}'.isEmpty()")
class ModerationNotifier(

    private val discordBot: DiscordBot,
    private val discordProperties: DiscordProperties,
) {

    @EventListener
    fun notifyBlocked(event: MemberTextBlockedEvent) {
        runCatching { discordBot.send(discordProperties.moderationChannelId, toEmbeds(event)) }
            .onFailure { log.error(it) { "검수 결과를 알리지 못했다. memberId=${event.memberId}" } }
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
