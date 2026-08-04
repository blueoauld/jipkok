package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.event.MemberTextChangedEvent
import com.blueoauld.server.domain.member.repository.MemberRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Service
class MemberTextModerationService(

    private val memberRepository: MemberRepository,
    private val textModerator: TextModerator?,
) {

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun moderate(event: MemberTextChangedEvent) {
        val moderator = textModerator ?: return
        val member = memberRepository.findById(event.memberId).orElse(null) ?: return

        runCatching {
            member.commentBlocked = member.comment?.let { moderator.isInappropriate(it) } == true
            member.bioBlocked = member.bio?.let { moderator.isInappropriate(it) } == true
        }.onFailure { log.error(it) { "글을 검수하지 못했다. memberId=${event.memberId}" } }
    }
}
