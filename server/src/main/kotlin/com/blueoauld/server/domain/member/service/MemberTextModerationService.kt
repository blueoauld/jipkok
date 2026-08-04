package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.event.MemberTextBlockedEvent
import com.blueoauld.server.domain.member.event.MemberTextChangedEvent
import com.blueoauld.server.domain.member.repository.MemberRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
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
    private val eventPublisher: ApplicationEventPublisher,
    private val textModerator: TextModerator?,
) {

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun moderate(event: MemberTextChangedEvent) {
        val moderator = textModerator ?: return
        val member = memberRepository.findById(event.memberId).orElse(null) ?: return

        runCatching {
            member.commentBlocked = check(moderator, member, COMMENT, member.comment)
            member.bioBlocked = check(moderator, member, BIO, member.bio)
        }.onFailure { log.error(it) { "글을 검수하지 못했다. memberId=${event.memberId}" } }
    }

    private fun check(moderator: TextModerator, member: Member, field: String, text: String?): Boolean {
        if (text.isNullOrBlank()) {
            return false
        }

        val result = moderator.moderate(text)

        if (result.inappropriate) {
            eventPublisher.publishEvent(
                MemberTextBlockedEvent(
                    memberId = member.id,
                    nickname = member.nickname,
                    field = field,
                    text = text,
                    category = result.category,
                ),
            )
        }

        return result.inappropriate
    }

    companion object {

        private const val COMMENT = "코멘트"
        private const val BIO = "자기소개"
    }
}
