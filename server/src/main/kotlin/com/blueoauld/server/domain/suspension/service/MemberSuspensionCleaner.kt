package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.global.time.KOREA_ID
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class MemberSuspensionCleaner(

    private val memberSuspensionRepository: MemberSuspensionRepository,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUpEndedSuspensions() {
        val ids = memberSuspensionRepository.findIdsExpiredBefore(clock.instant().minus(RETENTION))

        if (ids.isEmpty()) {
            return
        }

        memberSuspensionRepository.deleteAllByIdIn(ids)

        log.info { "끝난 정지 ${ids.size}건을 정리했다." }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(365)

        private const val CLEAN_UP_CRON = "0 50 4 * * *"
    }
}
