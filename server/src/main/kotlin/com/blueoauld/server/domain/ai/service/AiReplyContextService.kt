package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.AiReplyDecision
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.ai.repository.AiRoomMemoryRepository
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.today
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.util.concurrent.atomic.AtomicReference
import kotlin.random.Random

private val log = KotlinLogging.logger {}

@Service
class AiReplyContextService(

    private val aiPersonaRepository: AiPersonaRepository,
    private val aiReplyLogRepository: AiReplyLogRepository,
    private val aiRoomMemoryRepository: AiRoomMemoryRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val memberRepository: MemberRepository,
    private val memberSuspensionService: MemberSuspensionService,
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

        if (memberSuspensionService.isSuspended(ai.id, SuspensionType.SERVICE)) {
            return AiReplyDecision.Drop("AI 회원이 정지 중이다.")
        }
        val partner = memberRepository.findById(room.partnerIdOf(ai.id)).orElse(null)
            ?: return AiReplyDecision.Drop("상대가 탈퇴했다.")

        val lastReadMessageId = chatRoomMemberRepository.findByRoomIdAndMemberId(room.id, ai.id)?.lastReadMessageId
            ?: return AiReplyDecision.Drop("AI가 방에 없다.")

        if (job.kind == AiReplyKind.REPLY && job.lastMessageId <= lastReadMessageId) {
            return AiReplyDecision.Drop("이미 답한 메시지다.")
        }

        val messages = chatMessageRepository
            .findByRoomIdAndIdLessThanOrderByIdDesc(room.id, Long.MAX_VALUE, Limit.of(AiReplyContext.MAX_MESSAGES))
            .asReversed()

        if (messages.isEmpty()) {
            return AiReplyDecision.Drop("메시지가 없다.")
        }

        if (job.kind == AiReplyKind.NUDGE && messages.last().senderId != ai.id) {
            return AiReplyDecision.Drop("상대가 이미 답해서 말을 걸 필요가 없다.")
        }

        val now = clock.instant()

        if (!persona.isActiveAt(now)) {
            return AiReplyDecision.Postpone(persona.nextActiveStart(now).plus(persona.randomReplyDelay()))
        }

        limitPostpone(room.id, persona, now)?.let { return it }

        val silentDays = if (job.kind == AiReplyKind.NUDGE) {
            Duration.between(messages.last().createdAt, now).toDays()
        } else {
            null
        }

        val memory = aiRoomMemoryRepository.findById(room.id).orElse(null)?.summary
        val language = detectLanguage(messages, ai.id, partner.locale)
        val lastPartnerMessageAt = messages.lastOrNull { it.senderId != ai.id }?.createdAt

        return AiReplyDecision.Reply(
            AiReplyContext(
                ai = ai,
                systemPrompt = persona.systemPrompt,
                partner = partner,
                messages = messages,
                language = language,
                now = now,
                silentDays = silentDays,
                memory = memory,
                lastPartnerMessageAt = lastPartnerMessageAt,
            ),
        )
    }

    // 한도는 한국 날짜로 초기화되므로 작업을 버리지 않고 다음 날 활동 시작 뒤로 미룬다. 실행할 때 대화를 다시 읽어
    // 그동안 쌓인 말에 답하게 되고, 밀린 방들이 한꺼번에 나가지 않도록 한 시간 안에 흩는다.
    private fun limitPostpone(roomId: Long, persona: AiPersona, now: Instant): AiReplyDecision.Postpone? {
        val today = clock.today()
        val dayStart = today.atStartOfDay(KOREA).toInstant()

        val roomCount = aiReplyLogRepository.countByRoomIdAndKindNotAndCreatedAtGreaterThanEqual(
            roomId,
            AiReplyKind.SUMMARY,
            dayStart,
        )

        if (roomCount >= ROOM_DAILY_LIMIT) {
            return postponeToNextDay(persona, now, today)
        }

        val aiCount = aiReplyLogRepository.countByAiMemberIdAndKindNotAndCreatedAtGreaterThanEqual(
            persona.memberId,
            AiReplyKind.SUMMARY,
            dayStart,
        )

        if (aiCount >= persona.dailyReplyLimit) {
            return postponeToNextDay(persona, now, today)
        }

        val globalCount = aiReplyLogRepository.countByKindNotAndCreatedAtGreaterThanEqual(AiReplyKind.SUMMARY, dayStart)

        if (globalCount >= GLOBAL_DAILY_LIMIT) {
            alertGlobalLimit(today)

            return postponeToNextDay(persona, now, today)
        }

        return null
    }

    private fun postponeToNextDay(persona: AiPersona, now: Instant, today: LocalDate): AiReplyDecision.Postpone {
        val tomorrow = today.plusDays(1).atStartOfDay(KOREA).toInstant()
        val start = maxOf(tomorrow, persona.nextActiveStart(now))

        return AiReplyDecision.Postpone(start.plusSeconds(Random.nextLong(LIMIT_SPREAD.seconds + 1)))
    }

    private fun alertGlobalLimit(today: LocalDate) {
        if (globalLimitAlertedOn.getAndSet(today) != today) {
            log.error { "AI 응답 일일 상한에 걸렸다. limit=$GLOBAL_DAILY_LIMIT" }
        }
    }

    companion object {

        const val ROOM_DAILY_LIMIT = 100L
        const val GLOBAL_DAILY_LIMIT = 2000L

        val LIMIT_SPREAD: Duration = Duration.ofHours(1)
    }
}
