package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.service.PushService
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit

private val log = KotlinLogging.logger {}

@Component
class FeedReminder(

    private val memberRepository: MemberRepository,
    private val pushService: PushService,
    private val clock: Clock,
) {

    @Scheduled(cron = REMIND_CRON, zone = KOREA)
    @Transactional
    fun remind() {
        val now = clock.instant()
        val targets = memberRepository.findFeedReminderTargets(now.truncatedTo(ChronoUnit.HOURS), now)

        if (targets.isEmpty()) {
            return
        }

        pushService.sendAll(targets, TITLE, bodyOf(now), DATA, COLLAPSE_KEY)
        log.info { "피드 알림을 ${targets.size}명에게 보냈다." }
    }

    companion object {

        const val TITLE = "피드"

        const val COLLAPSE_KEY = "feed"

        val DATA = mapOf("screen" to "feed")

        val BODIES = listOf(
            "지금 무엇을 하고 있는지 올려주세요.",
            "이 시간의 나를 남겨보세요.",
            "지금 눈앞에 무엇이 보이나요?",
            "한 장으로 지금을 기록해보세요.",
            "이 순간은 지금만 올릴 수 있어요.",
        )

        fun bodyOf(now: Instant) = BODIES[now.atZone(ZoneId.of(KOREA)).hour % BODIES.size]

        private const val REMIND_CRON = "0 0 */3 * * *"
        private const val KOREA = "Asia/Seoul"
    }
}
