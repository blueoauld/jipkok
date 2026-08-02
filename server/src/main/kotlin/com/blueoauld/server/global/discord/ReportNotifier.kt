package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.event.ReportCreatedEvent
import com.blueoauld.server.global.properties.DiscordProperties
import io.github.oshai.kotlinlogging.KotlinLogging
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
        runCatching { discordBot.send(discordProperties.reportChannelId, toMessage(event)) }
            .onFailure { log.error(it) { "신고를 알리지 못했다. reportId=${event.reportId}" } }
    }

    private fun toMessage(event: ReportCreatedEvent) = buildString {
        val snapshot = event.snapshot

        appendLine("`#${event.reportId}` ${event.type.label} / ${event.reason.label}")
        appendLine(
            "${snapshot.reporter.nickname}(`#${snapshot.reporter.memberId}`)" +
                    " → ${snapshot.reported.nickname}(`#${snapshot.reported.memberId}`)",
        )
        event.detail?.let { appendLine("상세: $it") }

        if (event.type == ReportType.CHAT) {
            appendLine(describeMessages(snapshot))
        } else {
            appendLine("공개 사진 ${snapshot.reported.photoKeys.size}장")
            appendLine("코멘트: ${snapshot.reported.comment ?: "없음"}")
            appendLine("자기소개: ${snapshot.reported.bio ?: "없음"}")
        }

        append("증거 사진 ${event.evidencePhotoCount}장")
    }

    private fun describeMessages(snapshot: ReportSnapshotContent): String {
        if (snapshot.messages.isEmpty()) {
            return "대화 없음"
        }

        val recent = snapshot.messages.takeLast(RECENT_MESSAGE_COUNT)

        return recent.joinToString(
            "\n",
            prefix = "대화 ${snapshot.messages.size}건 중 마지막 ${recent.size}건\n",
        ) { "${nicknameOf(snapshot, it)}: ${contentOf(it)}" }
    }

    private fun nicknameOf(snapshot: ReportSnapshotContent, message: ChatMessageSnapshot) =
        if (message.senderId == snapshot.reporter.memberId) {
            snapshot.reporter.nickname
        } else {
            snapshot.reported.nickname
        }

    private fun contentOf(message: ChatMessageSnapshot) =
        if (message.type == ChatMessageType.PHOTO) "사진" else message.content ?: ""

    companion object {

        private const val RECENT_MESSAGE_COUNT = 3
    }
}
