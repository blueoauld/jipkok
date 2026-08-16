package com.blueoauld.server.domain.profileview.service

import com.blueoauld.server.domain.profileview.event.ProfileViewedEvent
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
class ProfileViewRecorder(

    private val profileViewService: ProfileViewService,
) {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun record(event: ProfileViewedEvent) {
        runCatching { profileViewService.record(event.viewerId, event.viewedMemberId) }
            .onFailure {
                log.error(it) { "프로필 조회를 기록하지 못했다. viewerId=${event.viewerId}" }
            }
    }
}
