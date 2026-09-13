package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.event.MemberSuspensionChangedEvent
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.domain.suspension.repository.SuspendedMemberCache
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant

@Service
class MemberSuspensionService(

    private val memberSuspensionRepository: MemberSuspensionRepository,
    private val suspendedMemberCache: SuspendedMemberCache,
    private val memberRepository: MemberRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Transactional
    fun suspend(
        memberId: Long,
        type: SuspensionType,
        reason: SuspensionReason,
        days: Long?,
        detail: String?,
    ): MemberSuspension {
        val member = memberRepository.getMember(memberId)
        val now = clock.instant()

        if (findActiveOf(memberId, type, now).isNotEmpty()) {
            throw BusinessException(ErrorCode.DUPLICATE_SUSPENSION)
        }

        return memberSuspensionRepository.save(
            MemberSuspension(
                phoneNumber = member.phoneNumber,
                memberId = member.id,
                nickname = member.nickname,
                type = type,
                reason = reason,
                startedAt = now,
                expiresAt = days?.let { now.plus(Duration.ofDays(it)) },
                detail = detail,
            ),
        ).also { publishChanged(listOf(it)) }
    }

    @Transactional
    fun release(suspensionId: Long): MemberSuspension {
        val suspension = memberSuspensionRepository.findById(suspensionId).orElseThrow {
            BusinessException(ErrorCode.SUSPENSION_NOT_FOUND)
        }
        val now = clock.instant()

        if (!suspension.isActive(now)) {
            throw BusinessException(ErrorCode.SUSPENSION_NOT_FOUND)
        }

        val released = memberSuspensionRepository.findActiveByPhoneNumber(suspension.phoneNumber, suspension.type, now)

        released.forEach { it.releasedAt = now }
        publishChanged(released)

        return suspension
    }

    private fun findActiveOf(memberId: Long, type: SuspensionType, now: Instant) =
        memberSuspensionRepository.findActive(memberId, now).filter { it.type == type }

    @Transactional(readOnly = true)
    fun findActive(memberId: Long): List<MemberSuspension> =
        memberSuspensionRepository.findActive(memberId, clock.instant())

    private fun publishChanged(suspensions: List<MemberSuspension>) {
        val memberIds = suspensions.flatMap { suspension ->
            listOfNotNull(suspension.memberId, memberRepository.findByPhoneNumber(suspension.phoneNumber)?.id)
        }

        eventPublisher.publishEvent(MemberSuspensionChangedEvent(memberIds.toSet()))
    }

    @Transactional(readOnly = true)
    fun checkPhoneNumber(phoneNumber: String, type: SuspensionType) {
        if (memberSuspensionRepository.existsActiveByPhoneNumber(phoneNumber, type, clock.instant())) {
            throw BusinessException(errorCodeOf(type))
        }
    }

    fun check(memberId: Long, type: SuspensionType) {
        if (isSuspended(memberId, type)) {
            throw BusinessException(errorCodeOf(type))
        }
    }

    fun isSuspended(memberId: Long, type: SuspensionType): Boolean {
        suspendedMemberCache.find(memberId, type)?.let { return it }

        val now = clock.instant()
        val active = findActiveOf(memberId, type, now)
        val suspended = active.isNotEmpty()

        suspendedMemberCache.save(memberId, type, suspended, cacheTtlOf(active, now))

        return suspended
    }

    private fun cacheTtlOf(active: List<MemberSuspension>, now: Instant): Duration {
        val lastExpiresAt = active.map { it.expiresAt ?: return SuspendedMemberCache.TTL }.maxOrNull()
            ?: return SuspendedMemberCache.TTL

        return Duration.between(now, lastExpiresAt).coerceIn(SuspendedMemberCache.MIN_TTL, SuspendedMemberCache.TTL)
    }

    private fun errorCodeOf(type: SuspensionType) = when (type) {
        SuspensionType.SECRET_PHOTO -> ErrorCode.SECRET_PHOTO_SUSPENDED
        SuspensionType.PROFILE_EDIT -> ErrorCode.PROFILE_EDIT_SUSPENDED
        SuspensionType.SERVICE -> ErrorCode.SERVICE_SUSPENDED
    }
}
