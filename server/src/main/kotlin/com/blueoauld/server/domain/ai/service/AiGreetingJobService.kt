package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.type.AiGreetingState
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.ai.repository.AiGreetingJobRepository
import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.chat.service.ChatNoteService
import com.blueoauld.server.domain.member.entity.type.Gender
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant
import kotlin.random.Random

@Service
class AiGreetingJobService(

    private val aiGreetingJobRepository: AiGreetingJobRepository,
    private val aiReplyLogRepository: AiReplyLogRepository,
    private val chatNoteService: ChatNoteService,
    private val clock: Clock,
) {

    @Transactional
    fun schedule(): Int {
        val now = clock.instant()
        val memberIds = aiGreetingJobRepository.findCandidates(
            gender = TARGET_GENDER.name,
            oldest = now.minus(MAX_MEMBER_AGE),
            threshold = now.minus(MIN_MEMBER_AGE),
            size = SCAN_BATCH_SIZE,
        )

        memberIds.forEach { aiGreetingJobRepository.insertIfAbsent(it, now.plus(randomDelay()), now) }

        return memberIds.size
    }

    @Transactional(readOnly = true)
    fun findDue(now: Instant): List<AiGreetingJob> = aiGreetingJobRepository
        .findAllByStateAndDueAtLessThanEqualOrderByDueAt(AiGreetingState.PENDING, now, Limit.of(BATCH_SIZE))

    @Transactional
    fun complete(job: AiGreetingJob, context: AiGreetingContext, reply: AiReply) {
        val sent = chatNoteService.send(context.ai.id, job.memberId, reply.content)

        aiReplyLogRepository.save(
            AiReplyLog(
                aiMemberId = context.ai.id,
                roomId = sent.roomId,
                messageId = sent.messageId,
                promptTokens = reply.promptTokens,
                completionTokens = reply.completionTokens,
                model = reply.model,
                kind = AiReplyKind.GREETING,
            ),
        )
        aiGreetingJobRepository.findById(job.memberId)
            .ifPresent { it.markSent(context.ai.id, sent.roomId, clock.instant()) }
    }

    @Transactional
    fun postpone(job: AiGreetingJob, dueAt: Instant) {
        aiGreetingJobRepository.findById(job.memberId).ifPresent { it.postpone(dueAt) }
    }

    @Transactional
    fun drop(job: AiGreetingJob, reason: String) {
        aiGreetingJobRepository.findById(job.memberId).ifPresent { it.drop(reason) }
    }

    @Transactional
    fun fail(job: AiGreetingJob) {
        aiGreetingJobRepository.findById(job.memberId).ifPresent {
            if (it.hasAttemptsLeft()) {
                it.retry(clock.instant().plus(AiGreetingJob.RETRY_DELAY))
            } else {
                it.drop("${AiGreetingJob.MAX_ATTEMPTS}번 실패했다.")
            }
        }
    }

    companion object {

        val TARGET_GENDER = Gender.FEMALE

        const val BATCH_SIZE = 20
        const val SCAN_BATCH_SIZE = 50

        val MIN_MEMBER_AGE: Duration = Duration.ofMinutes(10)
        val MAX_MEMBER_AGE: Duration = Duration.ofDays(3)
        val DELAY_MIN: Duration = Duration.ofMinutes(10)
        val DELAY_MAX: Duration = Duration.ofHours(2)

        fun randomDelay(): Duration = Duration.ofSeconds(Random.nextLong(DELAY_MIN.seconds, DELAY_MAX.seconds + 1))
    }
}
