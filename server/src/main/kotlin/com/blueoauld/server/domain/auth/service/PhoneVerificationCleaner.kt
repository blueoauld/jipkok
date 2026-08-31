package com.blueoauld.server.domain.auth.service

import com.blueoauld.server.domain.auth.repository.PhoneVerificationRepository
import com.blueoauld.server.global.time.KOREA_ID
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class PhoneVerificationCleaner(

    private val phoneVerificationRepository: PhoneVerificationRepository,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUp() {
        val removed = phoneVerificationRepository.deleteAllIssuedBefore(clock.instant().minus(RETENTION))

        if (removed > 0) {
            log.info { "오래된 인증 번호 기록 ${removed}건을 정리했다." }
        }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)

        private const val CLEAN_UP_CRON = "0 55 4 * * *"
    }
}
