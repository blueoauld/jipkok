package com.blueoauld.server.domain.member.dto.response

import com.blueoauld.server.domain.member.entity.type.Gender
import java.time.Instant

data class MemberDetailResponse(

    val memberId: Long,
    val publicPhotoUrls: List<String>,
    val secretPhotoCount: Int,
    val nickname: String,
    val gender: Gender,
    val age: Int,
    val receivedLikeCount: Int,
    val locatedAt: Instant?,
    val distance: Double?,
    val comment: String?,
    val bio: String?,
    val likedByMe: Boolean,
    val favoritedByMe: Boolean,
    val secretPhotoGrantedToMe: Boolean,
    val secretPhotoGrantedByMe: Boolean,
    val blockedByMe: Boolean,
    val noteReceiveEnabled: Boolean,
)
