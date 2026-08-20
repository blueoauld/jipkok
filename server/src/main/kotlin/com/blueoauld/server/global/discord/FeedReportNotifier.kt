package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.feed.event.FeedPostAutoDeletedEvent
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.global.properties.DiscordProperties
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.github.oshai.kotlinlogging.KotlinLogging
import net.dv8tion.jda.api.entities.MessageEmbed
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${discord.token:}'.isEmpty()")
class FeedReportNotifier(

    private val discordBot: DiscordBot,
    private val discordProperties: DiscordProperties,
    private val memberAdminService: MemberAdminService,
    private val photoStorage: PhotoStorage,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun notifyAutoDeleted(event: FeedPostAutoDeletedEvent) {
        runCatching { discordBot.send(discordProperties.reportChannelId, toEmbeds(event)) }
            .onFailure { log.error(it) { "피드 삭제를 알리지 못했다. postId=${event.postId}" } }
    }

    private fun toEmbeds(event: FeedPostAutoDeletedEvent): List<MessageEmbed> {
        val nickname = memberAdminService.findNickname(event.memberId)

        val body = listOf(
            DiscordEmbeds.field("ID", "`${event.postId}`"),
            DiscordEmbeds.field("회원", "$nickname(`${event.memberId}`)"),
            DiscordEmbeds.field("신고", "${event.reportCount}회"),
            DiscordEmbeds.field("시간", DiscordEmbeds.format(event.slotAt)),
            DiscordEmbeds.field("문구", event.caption ?: NONE),
            DiscordEmbeds.field("사진", photoStorage.toPublicUrl(event.objectKey)),
        ).joinToString("\n\n")

        return DiscordEmbeds.of(TITLE, body)
    }

    companion object {

        private const val TITLE = "피드 삭제"
        private const val NONE = "없음"
    }
}
