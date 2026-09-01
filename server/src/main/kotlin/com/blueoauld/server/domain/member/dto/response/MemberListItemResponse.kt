package com.blueoauld.server.domain.member.dto.response

import com.blueoauld.server.domain.member.entity.type.Gender
import java.time.Instant

data class MemberListItemResponse(

    val memberId: Long,
    val nickname: String,
    val gender: Gender,
    val age: Int,
    val receivedLikeCount: Int,
    val comment: String?,
    val profileImageUrl: String?,
    val memo: String?,
    val locatedAt: Instant?,
    val distance: Double?,
    val favoritedByMe: Boolean,
) {

    companion object {

        fun of(
            summary: MemberSummaryResponse,
            locatedAt: Instant?,
            distance: Double?,
            favoritedByMe: Boolean,
        ) = MemberListItemResponse(
            memberId = summary.memberId,
            nickname = summary.nickname,
            gender = summary.gender,
            age = summary.age,
            receivedLikeCount = summary.receivedLikeCount,
            comment = summary.comment,
            profileImageUrl = summary.profileImageUrl,
            memo = summary.memo,
            locatedAt = locatedAt,
            distance = distance,
            favoritedByMe = favoritedByMe,
        )
    }
}
