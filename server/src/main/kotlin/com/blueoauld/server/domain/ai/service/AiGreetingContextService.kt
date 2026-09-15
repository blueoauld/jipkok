package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiGreetingContext
import com.blueoauld.server.domain.ai.dto.AiGreetingDecision
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.domain.ai.entity.type.AiGreetingState
import com.blueoauld.server.domain.ai.repository.AiGreetingJobRepository
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.today
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

@Service
class AiGreetingContextService(

    private val aiGreetingJobRepository: AiGreetingJobRepository,
    private val aiPersonaRepository: AiPersonaRepository,
    private val memberRepository: MemberRepository,
    private val memberSuspensionService: MemberSuspensionService,
    private val contactBlockRepository: ContactBlockRepository,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun decide(job: AiGreetingJob): AiGreetingDecision {
        val member = memberRepository.findById(job.memberId).orElse(null)
            ?: return AiGreetingDecision.Drop("회원이 탈퇴했다.")
        val now = clock.instant()

        if (member.createdAt.plus(AiGreetingJobService.MAX_MEMBER_AGE) < now) {
            return AiGreetingDecision.Drop("가입 후 ${AiGreetingJobService.MAX_MEMBER_AGE.toDays()}일이 지났다.")
        }

        if (!member.noteReceiveEnabled) {
            return AiGreetingDecision.Drop("쪽지를 받지 않는다.")
        }

        if (memberSuspensionService.isSuspended(member.id, SuspensionType.SERVICE)) {
            return AiGreetingDecision.Drop("정지 중이다.")
        }

        val latitude = member.latitude
        val longitude = member.longitude

        if (latitude == null || longitude == null) {
            return AiGreetingDecision.Postpone(now.plus(RECHECK_DELAY))
        }

        val dayStart = clock.today().atStartOfDay(KOREA).toInstant()

        if (aiGreetingJobRepository.countByStateAndSentAtGreaterThanEqual(AiGreetingState.SENT, dayStart) >=
            GLOBAL_DAILY_LIMIT
        ) {
            return AiGreetingDecision.Postpone(
                dayStart.plus(Duration.ofDays(1)).plus(AiGreetingJobService.randomDelay()),
            )
        }

        val candidate = aiGreetingJobRepository
            .findAiCandidates(
                memberId = member.id,
                gender = aiGenderFor(member).name,
                latitude = latitude,
                longitude = longitude,
                dayStart = dayStart,
                size = AI_CANDIDATE_SIZE,
            )
            .shuffled()
            .firstOrNull {
                !memberSuspensionService.isSuspended(it.aiMemberId, SuspensionType.SERVICE) &&
                    !contactBlockRepository.existsBetween(it.aiMemberId, member.id)
            }
            ?: return AiGreetingDecision.Postpone(now.plus(RECHECK_DELAY))

        val persona = aiPersonaRepository.findById(candidate.aiMemberId).orElse(null)
        val ai = memberRepository.findById(candidate.aiMemberId).orElse(null)

        if (persona == null || ai == null) {
            return AiGreetingDecision.Postpone(now.plus(RECHECK_DELAY))
        }

        if (!persona.isActiveAt(now)) {
            return AiGreetingDecision.Postpone(persona.nextActiveStart(now).plus(persona.randomReplyDelay()))
        }

        return AiGreetingDecision.Send(
            AiGreetingContext(ai, persona.systemPrompt, member, now, candidate.distanceMeters),
        )
    }

    private fun aiGenderFor(member: Member): Gender =
        if (member.gender == Gender.FEMALE) Gender.MALE else Gender.FEMALE

    companion object {

        const val AI_CANDIDATE_SIZE = 5
        const val GLOBAL_DAILY_LIMIT = 200L

        val RECHECK_DELAY: Duration = Duration.ofHours(1)
    }
}
