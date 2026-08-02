package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.suspension.dto.response.SuspensionDetail
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.domain.suspension.repository.SuspendedMemberCache
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

@Service
class MemberSuspensionService(

    private val memberSuspensionRepository: MemberSuspensionRepository,
    private val suspendedMemberCache: SuspendedMemberCache,
    private val memberRepository: MemberRepository,
    private val clock: Clock,
) {

    @Transactional
    fun suspend(
        memberId: Long,
        type: SuspensionType,
        reason: SuspensionReason,
        days: Long?,
        detail: String?,
    ): SuspensionDetail {
        val member = findMember(memberId)
        val now = clock.instant()

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
        ).also { evict(it) }
            .let { SuspensionDetail.of(it, withdrawn = false) }
    }

    @Transactional
    fun release(memberId: Long, type: SuspensionType): SuspensionDetail {
        val member = findMember(memberId)
        val suspension = memberSuspensionRepository.findActive(memberId, clock.instant())
            .firstOrNull { it.type == type }
            ?: throw BusinessException(ErrorCode.SUSPENSION_NOT_FOUND)

        suspension.releasedAt = clock.instant()
        evict(suspension)

        return SuspensionDetail.of(suspension, withdrawn = suspension.memberId != member.id)
    }

    @Transactional(readOnly = true)
    fun findActive(memberId: Long): List<MemberSuspension> =
        memberSuspensionRepository.findActive(memberId, clock.instant())

    @Transactional(readOnly = true)
    fun findHistory(memberId: Long): List<SuspensionDetail> {
        val member = findMember(memberId)

        val suspensions = memberSuspensionRepository.findByPhoneNumberOrderByIdDesc(member.phoneNumber)
        val aliveIds = memberRepository.findAllById(suspensions.map { it.memberId }).map { it.id }.toSet()

        return suspensions.map { SuspensionDetail.of(it, withdrawn = it.memberId !in aliveIds) }
    }

    private fun findMember(memberId: Long) = memberRepository.findById(memberId).orElseThrow {
        BusinessException(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun evict(suspension: MemberSuspension) {
        suspendedMemberCache.evict(suspension.memberId)
        memberRepository.findByPhoneNumber(suspension.phoneNumber)
            ?.takeIf { it.id != suspension.memberId }
            ?.let { suspendedMemberCache.evict(it.id) }
    }

    @Transactional(readOnly = true)
    fun check(memberId: Long, type: SuspensionType) {
        if (isSuspended(memberId, type)) {
            throw BusinessException(errorCodeOf(type))
        }
    }

    private fun isSuspended(memberId: Long, type: SuspensionType): Boolean {
        suspendedMemberCache.find(memberId, type)?.let { return it }

        return memberSuspensionRepository.existsActive(memberId, type, clock.instant())
            .also { suspendedMemberCache.save(memberId, type, it) }
    }

    private fun errorCodeOf(type: SuspensionType) = when (type) {
        SuspensionType.SECRET_PHOTO -> ErrorCode.SECRET_PHOTO_SUSPENDED
        SuspensionType.PROFILE_EDIT -> ErrorCode.PROFILE_EDIT_SUSPENDED
        SuspensionType.SERVICE -> ErrorCode.SERVICE_SUSPENDED
    }
}
