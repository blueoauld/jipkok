package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.entity.AiReplyBubble
import com.blueoauld.server.domain.ai.repository.AiReplyBubbleRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.service.ChatMessageService
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant
import kotlin.random.Random

private val log = KotlinLogging.logger {}

@Service
class AiReplyBubbleService(

    private val aiReplyBubbleRepository: AiReplyBubbleRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val chatMessageService: ChatMessageService,
    private val clock: Clock,
) {

    @Transactional
    fun enqueue(roomId: Long, aiMemberId: Long, bubbles: List<String>) {
        val dueTimes = bubbles.runningFold(clock.instant()) { dueAt, content -> dueAt.plus(delayOf(content)) }.drop(1)

        aiReplyBubbleRepository.saveAll(
            bubbles.zip(dueTimes) { content, dueAt -> AiReplyBubble(roomId, aiMemberId, content, dueAt) },
        )
    }

    @Transactional(readOnly = true)
    fun findDue(now: Instant): List<AiReplyBubble> =
        aiReplyBubbleRepository.findAllByDueAtLessThanEqualOrderByDueAtAscIdAsc(now, Limit.of(BATCH_SIZE))

    @Transactional
    fun send(bubble: AiReplyBubble) {
        aiReplyBubbleRepository.deleteById(bubble.id)
        val room = chatRoomRepository.findById(bubble.roomId).orElse(null) ?: return

        if (Duration.between(bubble.dueAt, clock.instant()) > STALE_AFTER) {
            log.info { "너무 늦어진 AI 말풍선을 버린다. roomId=${bubble.roomId}" }
            return
        }

        chatMessageService.append(
            room = room,
            senderId = bubble.aiMemberId,
            message = ChatMessage(
                roomId = room.id,
                senderId = bubble.aiMemberId,
                type = ChatMessageType.TEXT,
                content = bubble.content,
            ),
        )
    }

    @Transactional
    fun drop(bubble: AiReplyBubble) {
        aiReplyBubbleRepository.deleteById(bubble.id)
    }

    private fun delayOf(content: String): Duration {
        val typing = TYPING_PER_CHAR.multipliedBy(content.length.toLong())

        return typing.coerceIn(DELAY_MIN, DELAY_MAX).plusMillis(Random.nextLong(DELAY_JITTER.toMillis() + 1))
    }

    companion object {

        const val BATCH_SIZE = 50

        val TYPING_PER_CHAR: Duration = Duration.ofMillis(100)
        val DELAY_MIN: Duration = Duration.ofSeconds(1)
        val DELAY_MAX: Duration = Duration.ofSeconds(3)
        val DELAY_JITTER: Duration = Duration.ofMillis(500)
        val STALE_AFTER: Duration = Duration.ofMinutes(10)
    }
}
