package com.blueoauld.server.domain.suspension.dto.response

import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import java.time.Instant

data class SuspensionDetail(

    val id: Long,
    val memberId: Long,
    val nickname: String,
    val withdrawn: Boolean,
    val type: SuspensionType,
    val reason: SuspensionReason,
    val startedAt: Instant,
    val expiresAt: Instant?,
    val releasedAt: Instant?,
    val detail: String?,
) {

    companion object {

        fun of(suspension: MemberSuspension, withdrawn: Boolean) = SuspensionDetail(
            id = suspension.id,
            memberId = suspension.memberId,
            nickname = suspension.nickname,
            withdrawn = withdrawn,
            type = suspension.type,
            reason = suspension.reason,
            startedAt = suspension.startedAt,
            expiresAt = suspension.expiresAt,
            releasedAt = suspension.releasedAt,
            detail = suspension.detail,
        )
    }
}
