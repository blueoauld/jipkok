package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import kotlin.random.Random

@Component
class AiLocationRefresher(

    private val aiPersonaRepository: AiPersonaRepository,
    private val memberRepository: MemberRepository,
    private val clock: Clock,
) {

    @Scheduled(fixedDelay = REFRESH_INTERVAL_MILLIS)
    @Transactional
    fun refresh() {
        val now = clock.instant()
        val personas = aiPersonaRepository.findAllByEnabledTrueAndNextLocationRefreshAtLessThanEqual(now)

        if (personas.isEmpty()) {
            return
        }

        val members = memberRepository.findAllById(personas.map(AiPersona::memberId)).associateBy { it.id }

        personas.forEach { persona ->
            if (persona.isActiveAt(now)) {
                members[persona.memberId]?.locatedAt = now
                persona.nextLocationRefreshAt = now.plus(randomInterval())
            } else {
                persona.nextLocationRefreshAt = persona.nextActiveStart(now).plus(randomOffset())
            }
        }
    }

    private fun randomInterval(): Duration = randomBetween(
        AiPersona.LOCATION_REFRESH_MIN_INTERVAL,
        AiPersona.LOCATION_REFRESH_MAX_INTERVAL,
    )

    private fun randomOffset(): Duration = randomBetween(Duration.ZERO, AiPersona.LOCATION_REFRESH_MAX_INTERVAL)

    private fun randomBetween(min: Duration, max: Duration): Duration =
        Duration.ofSeconds(Random.nextLong(min.seconds, max.seconds + 1))

    companion object {

        private const val REFRESH_INTERVAL_MILLIS = 60_000L
    }
}
