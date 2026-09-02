package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.repository.FeedReminderRepository
import com.blueoauld.server.domain.push.service.PushMessages
import com.blueoauld.server.domain.push.service.PushService
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.KOREA_ID
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.Instant
import java.time.temporal.ChronoUnit

private val log = KotlinLogging.logger {}

@Component
class FeedReminder(

    private val feedReminderRepository: FeedReminderRepository,
    private val pushService: PushService,
    private val pushMessages: PushMessages,
    private val clock: Clock,
) {

    @Scheduled(cron = REMIND_CRON, zone = KOREA_ID)
    fun remind() {
        val now = clock.instant()
        val targets = feedReminderRepository.findFeedReminderTargets(now.truncatedTo(ChronoUnit.HOURS), now)

        if (targets.isEmpty()) {
            return
        }

        targets.groupBy { it.getLocale() }.forEach { (locale, group) ->
            pushService.sendAll(
                group.map { it.getMemberId() },
                pushMessages.get(locale, TITLE_CODE),
                pushMessages.get(locale, bodyCodeOf(now)),
                DATA,
                COLLAPSE_KEY,
                CHANNEL_ID,
                PushService.PRIORITY_HIGH,
            )
        }

        log.info { "피드 알림을 ${targets.size}명에게 보냈다." }
    }

    companion object {

        const val TITLE_CODE = "push.feed.title"

        const val COLLAPSE_KEY = "feed"

        const val CHANNEL_ID = "feed"

        val DATA = mapOf("screen" to "feed")

        const val BODY_COUNT = 5

        fun bodyCodeOf(now: Instant) = "push.feed.body.${now.atZone(KOREA).hour % BODY_COUNT}"

        private const val REMIND_CRON = "0 0 9-21/3 * * *"
    }
}
