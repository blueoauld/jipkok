package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.TextTarget
import com.blueoauld.server.domain.member.event.MemberTextBlockedEvent
import com.blueoauld.server.domain.member.event.MemberTextChangedEvent
import com.blueoauld.server.domain.member.repository.MemberRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Service
class MemberTextModerationService(

    private val memberRepository: MemberRepository,
    private val memberTextBlocker: MemberTextBlocker,
    private val eventPublisher: ApplicationEventPublisher,
    private val textModerator: TextModerator?,
) {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun moderate(event: MemberTextChangedEvent) {
        val moderator = textModerator ?: return
        val member = memberRepository.findById(event.memberId).orElse(null) ?: return

        runCatching {
            blockIfNeeded(moderator, event.memberId, member.nickname, TextTarget.COMMENT, member.comment)
            blockIfNeeded(moderator, event.memberId, member.nickname, TextTarget.BIO, member.bio)
        }.onFailure { log.error(it) { "글을 검수하지 못했다. memberId=${event.memberId}" } }
    }

    private fun blockIfNeeded(
        moderator: TextModerator,
        memberId: Long,
        nickname: String,
        target: TextTarget,
        text: String?,
    ) {
        if (text.isNullOrBlank() || text == Member.BLOCKED_TEXT) {
            return
        }

        val result = moderator.moderate(text)

        if (!result.inappropriate) {
            return
        }

        memberTextBlocker.block(memberId, target)

        eventPublisher.publishEvent(
            MemberTextBlockedEvent(
                memberId = memberId,
                nickname = nickname,
                field = target.label,
                text = text,
                category = result.category,
            ),
        )
    }
}
