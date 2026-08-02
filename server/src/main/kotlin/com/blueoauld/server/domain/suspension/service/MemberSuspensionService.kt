package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.member.repository.MemberRepository
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
    ): MemberSuspension {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }
        val now = clock.instant()

        return memberSuspensionRepository.save(
            MemberSuspension(
                phoneNumber = member.phoneNumber,
                memberId = member.id,
                type = type,
                reason = reason,
                startedAt = now,
                expiresAt = days?.let { now.plus(Duration.ofDays(it)) },
                detail = detail,
            ),
        ).also { evict(it) }
    }

    @Transactional
    fun release(suspensionId: Long): MemberSuspension {
        val suspension = memberSuspensionRepository.findById(suspensionId).orElseThrow {
            BusinessException(ErrorCode.SUSPENSION_NOT_FOUND)
        }

        suspension.releasedAt = clock.instant()
        evict(suspension)

        return suspension
    }

    @Transactional(readOnly = true)
    fun findActive(memberId: Long): List<MemberSuspension> =
        memberSuspensionRepository.findActive(memberId, clock.instant())

    @Transactional(readOnly = true)
    fun findHistory(memberId: Long): List<MemberSuspension> {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        return memberSuspensionRepository.findByPhoneNumberOrderByIdDesc(member.phoneNumber)
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
