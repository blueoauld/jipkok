package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.report.event.ReportCreatedEvent
import com.blueoauld.server.global.discord.ConditionalOnDiscord
import com.blueoauld.server.global.discord.DiscordBot
import com.blueoauld.server.global.discord.DiscordEmbeds
import com.blueoauld.server.global.properties.AdminProperties
import com.blueoauld.server.global.properties.DiscordProperties
import net.dv8tion.jda.api.entities.MessageEmbed
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
@ConditionalOnDiscord
class ReportNotifier(

    private val discordBot: DiscordBot,
    private val discordProperties: DiscordProperties,
    private val adminProperties: AdminProperties,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun notifyCreated(event: ReportCreatedEvent) {
        discordBot.send(discordProperties.reportChannelId, toEmbeds(event))
    }

    private fun toEmbeds(event: ReportCreatedEvent): List<MessageEmbed> {
        val reporter = event.snapshot.reporter
        val reported = event.snapshot.reported

        val body = listOf(
            DiscordEmbeds.field("ID", "`${event.reportId}`"),
            DiscordEmbeds.field("유형", event.type.label),
            DiscordEmbeds.field("사유", event.reason.label),
            DiscordEmbeds.field("신고자", DiscordEmbeds.member(reporter.nickname, reporter.memberId)),
            DiscordEmbeds.field("피신고자", DiscordEmbeds.member(reported.nickname, reported.memberId)),
            DiscordEmbeds.field("링크", "${adminProperties.baseUrl}$DETAIL_PATH${event.reportId}"),
        ).joinToString("\n\n")

        return DiscordEmbeds.of(TITLE, body)
    }

    companion object {

        private const val TITLE = "신고 접수"
        private const val DETAIL_PATH = "/reports/members/detail?id="
    }
}
