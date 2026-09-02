package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.member.entity.type.Gender
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
