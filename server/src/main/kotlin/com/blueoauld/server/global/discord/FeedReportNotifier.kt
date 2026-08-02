package com.blueoauld.server.global.discord

import com.blueoauld.server.domain.feed.event.FeedPostAutoDeletedEvent
import com.blueoauld.server.domain.member.service.MemberService
import com.blueoauld.server.global.properties.DiscordProperties
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnExpression("!'\${discord.token:}'.isEmpty()")
class FeedReportNotifier(

    private val discordBot: DiscordBot,
    private val discordProperties: DiscordProperties,
    private val memberService: MemberService,
    private val photoStorage: PhotoStorage,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun notifyAutoDeleted(event: FeedPostAutoDeletedEvent) {
        runCatching { discordBot.send(discordProperties.reportChannelId, toMessage(event)) }
            .onFailure { log.error(it) { "피드 삭제를 알리지 못했다. postId=${event.postId}" } }
    }

    private fun toMessage(event: FeedPostAutoDeletedEvent) = buildString {
        val nickname = memberService.findForAdmin(event.memberId).nickname

        appendLine("신고 ${event.reportCount}회로 피드를 지웠습니다.")
        appendLine("`#${event.postId}` $nickname(`#${event.memberId}`) / ${format(event.slotAt)}")
        appendLine("문구: ${event.caption ?: "없음"}")
        append(photoStorage.toPublicUrl(event.objectKey))
    }

    private fun format(instant: Instant) = FORMATTER.format(instant.atZone(KOREA))

    companion object {

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")

        private val FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
    }
}
