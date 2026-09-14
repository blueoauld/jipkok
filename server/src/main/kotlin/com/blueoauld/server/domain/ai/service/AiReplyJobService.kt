package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import com.blueoauld.server.domain.ai.entity.AiReplyLog
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
import java.time.Instant

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
    fun complete(job: AiReplyJob, repliedMessageId: Long, reply: AiReply) {
        val room = chatRoomRepository.findById(job.roomId).orElse(null)

        if (room == null) {
            aiReplyJobRepository.deleteById(job.roomId)
            return
        }

        chatRoomMemberRepository.markRead(room.id, job.aiMemberId, repliedMessageId)
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
        aiReplyLogRepository.save(
            AiReplyLog(
                aiMemberId = job.aiMemberId,
                roomId = room.id,
                messageId = sent.messageId,
                promptTokens = reply.promptTokens,
                completionTokens = reply.completionTokens,
                model = reply.model,
            ),
        )
        aiReplyJobRepository.deleteIfUnchanged(job.roomId, job.lastMessageId)
    }

    companion object {

        const val BATCH_SIZE = 20
    }
}
