package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.admin.dto.AdminSuspensionStatus
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import java.time.Instant

data class AdminMemberPageResponse(

    val items: List<AdminMemberResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminMemberResponse(

    val id: Long,
    val nickname: String,
    val gender: Gender,
    val age: Int,
    val phoneNumber: String,
    val publicPhotoCount: Int,
    val secretPhotoCount: Int,
    val suspended: Boolean,
    val withdrawnAt: Instant?,
    val joinedAt: Instant,
)

data class AdminMemberDetailResponse(

    val id: Long,
    val nickname: String,
    val phoneNumber: String,
    val gender: Gender,
    val age: Int,
    val comment: String?,
    val bio: String?,
    val receivedLikeCount: Int,
    val pointBalance: Int,
    val noteReceiveEnabled: Boolean,
    val latitude: Double?,
    val longitude: Double?,
    val locatedAt: Instant?,
    val joinedAt: Instant,
    val withdrawnAt: Instant?,
    val publicPhotoUrls: List<String>,
    val secretPhotoUrls: List<String>,
    val suspensions: List<AdminSuspensionResponse>,
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
        )

        private fun statusOf(suspension: MemberSuspension, now: Instant) = when {
            suspension.releasedAt != null -> AdminSuspensionStatus.RELEASED
            suspension.expiresAt?.isAfter(now) == false -> AdminSuspensionStatus.EXPIRED
            else -> AdminSuspensionStatus.ACTIVE
        }
    }
}
