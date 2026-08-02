package com.blueoauld.server.domain.member.dto.response

import com.blueoauld.server.domain.member.entity.type.Gender
import java.time.Instant

data class AdminMemberDetail(

    val memberId: Long,
    val nickname: String,
    val phoneNumber: String,
    val gender: Gender,
    val birthYear: Int,
    val age: Int,
    val comment: String?,
    val bio: String?,
    val publicPhotoCount: Int,
    val secretPhotoCount: Int,
    val receivedLikeCount: Int,
    val pointBalance: Int,
    val noteReceiveEnabled: Boolean,
    val locatedAt: Instant?,
    val joinedAt: Instant,
)
