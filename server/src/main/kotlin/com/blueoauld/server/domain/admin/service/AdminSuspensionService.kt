package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.admin.dto.request.CreateSuspensionRequest
import com.blueoauld.server.domain.admin.dto.request.ReleaseSuspensionRequest
import com.blueoauld.server.domain.admin.dto.response.AdminSuspensionPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminSuspensionResponse
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class AdminSuspensionService(

    private val memberSuspensionRepository: MemberSuspensionRepository,
    private val memberSuspensionService: MemberSuspensionService,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findSuspensions(
        status: AdminSuspensionStatus?,
        type: SuspensionType?,
        memberId: Long?,
        page: Int,
        size: Int,
    ): AdminSuspensionPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)
        val now = clock.instant()

        val suspensions = memberSuspensionRepository.findAllForAdmin(
            status = status?.name,
            type = type?.name,
            memberId = memberId,
            now = now,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val totalCount = memberSuspensionRepository.countForAdmin(
            status = status?.name,
            type = type?.name,
            memberId = memberId,
            now = now,
        )

        return AdminSuspensionPageResponse(
            items = suspensions.map { AdminSuspensionResponse.of(it, now) },
            page = safePage,
            size = safeSize,
            totalCount = totalCount,
        )
    }

    @Transactional
    fun suspend(request: CreateSuspensionRequest): AdminSuspensionResponse {
        val detail = memberSuspensionService.suspend(
            memberId = request.memberId!!,
            type = request.type!!,
            reason = request.reason!!,
            days = request.days,
            detail = request.detail,
        )

        return AdminSuspensionResponse(
            id = detail.id,
            memberId = detail.memberId,
            nickname = detail.nickname,
            type = detail.type,
            reason = detail.reason,
            status = AdminSuspensionStatus.ACTIVE,
            startedAt = detail.startedAt,
            expiresAt = detail.expiresAt,
            releasedAt = detail.releasedAt,
        )
    }

    @Transactional
    fun release(request: ReleaseSuspensionRequest) {
        memberSuspensionService.release(request.memberId!!, request.type!!)
    }
}
