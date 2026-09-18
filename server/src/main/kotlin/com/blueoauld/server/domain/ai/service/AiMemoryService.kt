package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiSummaryContext
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.AiRoomMemory
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.ai.repository.AiRoomMemoryRepository
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service

private val log = KotlinLogging.logger {}

@Service
class AiMemoryService(

    private val aiRoomMemoryRepository: AiRoomMemoryRepository,
    private val aiReplyLogRepository: AiReplyLogRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val aiReplyGenerator: AiReplyGenerator,
) {

    fun refreshIfNeeded(roomId: Long, context: AiReplyContext) {
        runCatching { refresh(roomId, context) }
            .onFailure { log.error(it) { "AI 대화 기억을 갱신하지 못했다. roomId=$roomId" } }
    }

    private fun refresh(roomId: Long, context: AiReplyContext) {
        val memory = aiRoomMemoryRepository.findById(roomId).orElse(null)
        val summarizedMessageId = memory?.summarizedMessageId ?: 0L

        if (chatMessageRepository.countByRoomIdAndIdGreaterThan(roomId, summarizedMessageId) <
            AiRoomMemory.REFRESH_EVERY_MESSAGES
        ) {
            return
        }

        val messages = chatMessageRepository
            .findByRoomIdAndIdGreaterThanOrderByIdDesc(
                roomId,
                summarizedMessageId,
                Limit.of(AiRoomMemory.INPUT_MAX_MESSAGES),
            )
            .asReversed()
        val reply = aiReplyGenerator.summarize(
            AiSummaryContext(
                ai = context.ai,
                partner = context.partner,
                previousSummary = memory?.summary,
                messages = messages,
                language = context.language,
            ),
        ) ?: return
        val lastMessageId = messages.last().id

        aiRoomMemoryRepository.save(
            memory?.apply { update(reply.content, lastMessageId) }
                ?: AiRoomMemory(roomId, context.ai.id, reply.content, lastMessageId),
        )
        aiReplyLogRepository.save(
            AiReplyLog(
                aiMemberId = context.ai.id,
                roomId = roomId,
                messageId = lastMessageId,
                promptTokens = reply.promptTokens,
                completionTokens = reply.completionTokens,
                cachedTokens = reply.cachedTokens,
                model = reply.model,
                kind = AiReplyKind.SUMMARY,
            ),
        )
    }
}
