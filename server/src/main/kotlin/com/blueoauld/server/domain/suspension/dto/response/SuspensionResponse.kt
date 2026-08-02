package com.blueoauld.server.domain.suspension.dto.response

import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import java.time.Instant

data class SuspensionResponse(

    val type: SuspensionType,
    val reason: SuspensionReason,
    val startedAt: Instant,
    val expiresAt: Instant?,
) {

    companion object {

        fun from(suspension: MemberSuspension) = SuspensionResponse(
            type = suspension.type,
            reason = suspension.reason,
            startedAt = suspension.startedAt,
            expiresAt = suspension.expiresAt,
        )
    }
}
