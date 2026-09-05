package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.admin.dto.request.CreateSuspensionRequest
import com.blueoauld.server.domain.admin.dto.response.AdminSuspensionPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminSuspensionResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.SuspensionAdminRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class AdminSuspensionService(

    private val suspensionAdminRepository: SuspensionAdminRepository,
    private val memberSuspensionService: MemberSuspensionService,
    private val adminActionRecorder: AdminActionRecorder,
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

        val suspensions = suspensionAdminRepository.findAllForAdmin(
            status = status?.name,
            type = type?.name,
            memberId = memberId,
            now = now,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val totalCount = suspensionAdminRepository.countForAdmin(
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
    fun suspend(actorId: Long, request: CreateSuspensionRequest): AdminSuspensionResponse {
        val suspension = memberSuspensionService.suspend(
            memberId = request.memberId!!,
            type = request.type!!,
            reason = request.reason!!,
            days = request.days,
            detail = request.detail,
        )
        adminActionRecorder.record(
            actorId = actorId,
            action = AdminActionType.SUSPEND,
            targetId = request.memberId,
            detail = "${request.type} ${request.reason} ${request.days?.let { "${it}일" } ?: "영구"}",
        )

        return AdminSuspensionResponse.of(suspension, clock.instant())
    }

    @Transactional
    fun release(actorId: Long, suspensionId: Long) {
        val suspension = memberSuspensionService.release(suspensionId)
        adminActionRecorder.record(
            actorId = actorId,
            action = AdminActionType.RELEASE_SUSPENSION,
            targetId = suspension.memberId,
            detail = suspension.type.name,
        )
    }
}
