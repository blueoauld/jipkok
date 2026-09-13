package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.suspension.event.MemberSuspensionChangedEvent
import com.blueoauld.server.domain.suspension.repository.SuspendedMemberCache
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
class SuspendedMemberCacheEvictor(

    private val suspendedMemberCache: SuspendedMemberCache,
) {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun evict(event: MemberSuspensionChangedEvent) {
        event.memberIds.forEach { memberId ->
            runCatching { suspendedMemberCache.evict(memberId) }
                .onFailure { log.error(it) { "정지 캐시를 비우지 못했다. memberId=$memberId" } }
        }
    }
}
