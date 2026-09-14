package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiReplyDecision
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.AiReplyCountRepository
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.today
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.util.concurrent.atomic.AtomicReference

private val log = KotlinLogging.logger {}

@Service
class AiReplyContextService(

    private val aiPersonaRepository: AiPersonaRepository,
    private val aiReplyCountRepository: AiReplyCountRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val memberRepository: MemberRepository,
    private val clock: Clock,
) {

    private val globalLimitAlertedOn = AtomicReference<LocalDate?>(null)

    @Transactional(readOnly = true)
    fun decide(job: AiReplyJob): AiReplyDecision {
        val persona = aiPersonaRepository.findById(job.aiMemberId).orElse(null)

        if (persona == null || !persona.enabled) {
            return AiReplyDecision.Drop("페르소나가 없거나 비활성이다.")
        }

        val room = chatRoomRepository.findById(job.roomId).orElse(null)
            ?: return AiReplyDecision.Drop("채팅방이 없다.")
        val ai = memberRepository.findById(job.aiMemberId).orElse(null)
            ?: return AiReplyDecision.Drop("AI 회원이 없다.")
        val partner = memberRepository.findById(room.partnerIdOf(ai.id)).orElse(null)
            ?: return AiReplyDecision.Drop("상대가 탈퇴했다.")

        val lastReadMessageId = chatRoomMemberRepository.findByRoomIdAndMemberId(room.id, ai.id)?.lastReadMessageId
            ?: return AiReplyDecision.Drop("AI가 방에 없다.")

        if (job.lastMessageId <= lastReadMessageId) {
            return AiReplyDecision.Drop("이미 답한 메시지다.")
        }

        val messages = chatMessageRepository
            .findByRoomIdAndIdLessThanOrderByIdDesc(room.id, Long.MAX_VALUE, Limit.of(CONTEXT_SIZE))
            .asReversed()

        if (messages.isEmpty()) {
            return AiReplyDecision.Drop("메시지가 없다.")
        }

        val now = clock.instant()

        if (!persona.isActiveAt(now)) {
            return AiReplyDecision.Postpone(persona.nextActiveStart(now).plus(persona.randomReplyDelay()))
        }

        limitDrop(room.id, persona)?.let { return it }

        return AiReplyDecision.Reply(AiReplyContext(ai, persona, partner, messages, now))
    }

    private fun limitDrop(roomId: Long, persona: AiPersona): AiReplyDecision.Drop? {
        val today = clock.today()
        val dayStart = today.atStartOfDay(KOREA).toInstant()

        if (aiReplyCountRepository.countRoomRepliesSince(roomId, persona.memberId, dayStart) >= ROOM_DAILY_LIMIT) {
            return AiReplyDecision.Drop("방의 하루 응답 한도에 닿았다.")
        }

        if (aiReplyCountRepository.countRepliesSince(persona.memberId, dayStart) >= persona.dailyReplyLimit) {
            return AiReplyDecision.Drop("AI의 하루 응답 한도에 닿았다.")
        }

        if (aiReplyCountRepository.countAllRepliesSince(dayStart) >= GLOBAL_DAILY_LIMIT) {
            alertGlobalLimit(today)

            return AiReplyDecision.Drop("전체 하루 응답 한도에 닿았다.")
        }

        return null
    }

    private fun alertGlobalLimit(today: LocalDate) {
        if (globalLimitAlertedOn.getAndSet(today) != today) {
            log.error { "AI 응답 일일 상한에 걸렸다. limit=$GLOBAL_DAILY_LIMIT" }
        }
    }

    companion object {

        const val CONTEXT_SIZE = 30
        const val ROOM_DAILY_LIMIT = 100L
        const val GLOBAL_DAILY_LIMIT = 2000L
    }
}
