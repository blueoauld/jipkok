package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.domain.suspension.repository.SuspendedMemberCache
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class MemberSuspensionService(

    private val memberSuspensionRepository: MemberSuspensionRepository,
    private val suspendedMemberCache: SuspendedMemberCache,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findActive(memberId: Long): List<MemberSuspension> =
        memberSuspensionRepository.findActive(memberId, clock.instant())

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
