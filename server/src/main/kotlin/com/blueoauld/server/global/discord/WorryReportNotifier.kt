package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.worry.event.WorryCommentAutoDeletedEvent
import com.blueoauld.server.domain.worry.event.WorryPostReportedEvent
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
class WorryReportNotifier(

    private val discordBot: DiscordBot,
    private val discordProperties: DiscordProperties,
    private val memberAdminService: MemberAdminService,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun notifyPostReported(event: WorryPostReportedEvent) {
        runCatching { discordBot.send(discordProperties.reportChannelId, toPostEmbeds(event)) }
            .onFailure { log.error(it) { "고민 신고 누적을 알리지 못했다. postId=${event.postId}" } }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun notifyCommentAutoDeleted(event: WorryCommentAutoDeletedEvent) {
        runCatching { discordBot.send(discordProperties.reportChannelId, toCommentEmbeds(event)) }
            .onFailure { log.error(it) { "고민 댓글 삭제를 알리지 못했다. commentId=${event.commentId}" } }
    }

    private fun toPostEmbeds(event: WorryPostReportedEvent): List<MessageEmbed> {
        val body = listOf(
            DiscordEmbeds.field("ID", "`${event.postId}`"),
            DiscordEmbeds.field("회원", member(event.memberId)),
            DiscordEmbeds.field("신고", "${event.reportCount}회"),
            DiscordEmbeds.field("시간", DiscordEmbeds.format(event.createdAt)),
            DiscordEmbeds.field("내용", event.content),
        ).joinToString("\n\n")

        return DiscordEmbeds.of(POST_REPORTED_TITLE, body)
    }

    private fun toCommentEmbeds(event: WorryCommentAutoDeletedEvent): List<MessageEmbed> {
        val body = listOf(
            DiscordEmbeds.field("ID", "`${event.commentId}` (글 `${event.postId}`)"),
            DiscordEmbeds.field("회원", member(event.memberId)),
            DiscordEmbeds.field("신고", "${event.reportCount}회"),
            DiscordEmbeds.field("시간", DiscordEmbeds.format(event.createdAt)),
            DiscordEmbeds.field("내용", event.content),
        ).joinToString("\n\n")

        return DiscordEmbeds.of(COMMENT_DELETED_TITLE, body)
    }

    private fun member(memberId: Long) = "${memberAdminService.findNickname(memberId)}(`$memberId`)"

    companion object {

        private const val POST_REPORTED_TITLE = "고민 신고 누적"
        private const val COMMENT_DELETED_TITLE = "고민 댓글 삭제"
    }
}
