package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.AiReplyJobRepository
import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.service.ChatMessageService
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant
import kotlin.random.Random

@Service
class AiReplyJobService(

    private val aiReplyJobRepository: AiReplyJobRepository,
    private val aiReplyLogRepository: AiReplyLogRepository,
    private val aiPersonaRepository: AiPersonaRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val chatMessageService: ChatMessageService,
    private val clock: Clock,
) {

    @Transactional
    fun schedule(event: ChatMessageSentEvent) {
        val persona = aiPersonaRepository.findById(event.receiverId).orElse(null) ?: return

        if (!persona.enabled || aiPersonaRepository.existsById(event.message.senderId)) {
            return
        }

        val now = clock.instant()

        aiReplyJobRepository.upsert(
            roomId = event.message.roomId,
            aiMemberId = persona.memberId,
            lastMessageId = event.message.messageId,
            dueAt = now.plus(persona.randomReplyDelay()),
            now = now,
        )
    }

    @Transactional
    fun scheduleNudges(): Int {
        val now = clock.instant()
        val candidates = aiReplyJobRepository.findNudgeCandidates(
            oldest = now.minus(NUDGE_WINDOW),
            threshold = now.minus(NUDGE_AFTER),
            size = NUDGE_BATCH_SIZE,
        )

        candidates.forEach {
            aiReplyJobRepository.insertNudgeIfAbsent(
                roomId = it.roomId,
                aiMemberId = it.aiMemberId,
                lastMessageId = it.lastMessageId,
                dueAt = now.plusSeconds(Random.nextLong(NUDGE_SPREAD.seconds + 1)),
                now = now,
            )
        }

        return candidates.size
    }

    @Transactional(readOnly = true)
    fun findDue(now: Instant): List<AiReplyJob> =
        aiReplyJobRepository.findAllByDueAtLessThanEqualOrderByDueAt(now, Limit.of(BATCH_SIZE))

    @Transactional
    fun postpone(job: AiReplyJob, dueAt: Instant) {
        aiReplyJobRepository.postpone(job.roomId, dueAt, clock.instant())
    }

    @Transactional
    fun drop(job: AiReplyJob) {
        aiReplyJobRepository.deleteById(job.roomId)
    }

    @Transactional
    fun fail(job: AiReplyJob) {
        if (!job.hasAttemptsLeft()) {
            aiReplyJobRepository.deleteById(job.roomId)
            return
        }

        val now = clock.instant()
        aiReplyJobRepository.retry(job.roomId, now.plus(AiReplyJob.RETRY_DELAY), now)
    }

    @Transactional
    fun complete(job: AiReplyJob, context: AiReplyContext, reply: AiReply) {
        val room = chatRoomRepository.findById(job.roomId).orElse(null)

        if (room == null) {
            aiReplyJobRepository.deleteById(job.roomId)
            return
        }

        chatRoomMemberRepository.markRead(room.id, job.aiMemberId, context.lastMessageId)
        val sent = chatMessageService.append(
            room = room,
            senderId = job.aiMemberId,
            message = ChatMessage(
                roomId = room.id,
                senderId = job.aiMemberId,
                type = ChatMessageType.TEXT,
                content = reply.content,
            ),
        )
        saveLog(job, context, reply, sent.messageId, job.kind)
        aiReplyJobRepository.deleteIfUnchanged(job.roomId, job.lastMessageId)
    }

    @Transactional
    fun skip(job: AiReplyJob, context: AiReplyContext, reply: AiReply) {
        chatRoomMemberRepository.markRead(job.roomId, job.aiMemberId, context.lastMessageId)
        saveLog(job, context, reply, context.lastMessageId, AiReplyKind.SKIP)
        aiReplyJobRepository.deleteIfUnchanged(job.roomId, job.lastMessageId)
    }

    private fun saveLog(job: AiReplyJob, context: AiReplyContext, reply: AiReply, messageId: Long, kind: AiReplyKind) {
        aiReplyLogRepository.save(
            AiReplyLog(
                aiMemberId = job.aiMemberId,
                roomId = job.roomId,
                messageId = messageId,
                promptTokens = reply.promptTokens,
                completionTokens = reply.completionTokens,
                cachedTokens = reply.cachedTokens,
                model = reply.model,
                kind = kind,
                language = context.language,
                regenerated = reply.regenerated,
            ),
        )
    }

    companion object {

        const val BATCH_SIZE = 20
        const val NUDGE_BATCH_SIZE = 20

        val NUDGE_AFTER: Duration = Duration.ofDays(2)
        val NUDGE_WINDOW: Duration = Duration.ofDays(14)
        val NUDGE_SPREAD: Duration = Duration.ofHours(1)
    }
}
