package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import java.time.Instant

data class AdminSuspensionPageResponse(

    val items: List<AdminSuspensionResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminSuspensionResponse(

    val id: Long,
    val memberId: Long,
    val nickname: String,
    val type: SuspensionType,
    val reason: SuspensionReason,
    val status: AdminSuspensionStatus,
    val startedAt: Instant,
    val expiresAt: Instant?,
    val releasedAt: Instant?,
    val detail: String?,
) {

    companion object {

        fun of(suspension: MemberSuspension, now: Instant) = AdminSuspensionResponse(
            id = suspension.id,
            memberId = suspension.memberId,
            nickname = suspension.nickname,
            type = suspension.type,
            reason = suspension.reason,
            status = statusOf(suspension, now),
            startedAt = suspension.startedAt,
            expiresAt = suspension.expiresAt,
            releasedAt = suspension.releasedAt,
            detail = suspension.detail,
        )

        private fun statusOf(suspension: MemberSuspension, now: Instant) = when {
            suspension.releasedAt != null -> AdminSuspensionStatus.RELEASED
            suspension.expiresAt?.isAfter(now) == false -> AdminSuspensionStatus.EXPIRED
            else -> AdminSuspensionStatus.ACTIVE
        }
    }
}
