package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.event.ReportCreatedEvent
import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import net.dv8tion.jda.api.entities.MessageEmbed
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${discord.token:}'.isEmpty()")
class ReportNotifier(

    private val discordBot: DiscordBot,
    private val discordProperties: DiscordProperties,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun notifyCreated(event: ReportCreatedEvent) {
        runCatching { discordBot.send(discordProperties.reportChannelId, toEmbeds(event)) }
            .onFailure { log.error(it) { "신고를 알리지 못했다. reportId=${event.reportId}" } }
    }

    private fun toEmbeds(event: ReportCreatedEvent): List<MessageEmbed> {
        val snapshot = event.snapshot

        val body = buildList {
            add(DiscordEmbeds.field("ID", "`${event.reportId}`"))
            add(DiscordEmbeds.field("유형", event.type.label))
            add(DiscordEmbeds.field("사유", event.reason.label))
            add(DiscordEmbeds.field("신고자", "${snapshot.reporter.nickname}(`${snapshot.reporter.memberId}`)"))
            add(DiscordEmbeds.field("피신고자", "${snapshot.reported.nickname}(`${snapshot.reported.memberId}`)"))
            add(DiscordEmbeds.field("상세", event.detail ?: NONE))

            if (event.type == ReportType.CHAT) {
                add(DiscordEmbeds.field("대화", describeMessages(snapshot)))
            } else {
                add(DiscordEmbeds.field("공개 사진", "${snapshot.reported.photoKeys.size}장"))
                add(DiscordEmbeds.field("코멘트", snapshot.reported.comment ?: NONE))
                add(DiscordEmbeds.field("자기소개", snapshot.reported.bio ?: NONE))
            }

            add(DiscordEmbeds.field("증거 사진", "${event.evidencePhotoCount}장"))
        }.joinToString("\n\n")

        return DiscordEmbeds.of(TITLE, body)
    }

    private fun describeMessages(snapshot: ReportSnapshotContent): String {
        if (snapshot.messages.isEmpty()) {
            return NONE
        }

        val recent = snapshot.messages.takeLast(RECENT_MESSAGE_COUNT)

        return recent.joinToString(
            "\n",
            prefix = "${snapshot.messages.size}건 중 마지막 ${recent.size}건\n",
        ) { "${nicknameOf(snapshot, it)}: ${contentOf(it)}" }
    }

    private fun nicknameOf(snapshot: ReportSnapshotContent, message: ChatMessageSnapshot) =
        if (message.senderId == snapshot.reporter.memberId) {
            snapshot.reporter.nickname
        } else {
            snapshot.reported.nickname
        }

    private fun contentOf(message: ChatMessageSnapshot) = when (message.type) {
        ChatMessageType.TEXT -> message.content ?: ""
        ChatMessageType.PHOTO -> "사진"
        ChatMessageType.VIDEO -> "동영상"
    }

    companion object {

        private const val TITLE = "신고 접수"
        private const val NONE = "없음"

        private const val RECENT_MESSAGE_COUNT = 3
    }
}
