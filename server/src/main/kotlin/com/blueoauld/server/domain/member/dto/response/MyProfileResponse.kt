package com.blueoauld.server.domain.member.dto.response

import com.blueoauld.server.domain.member.entity.type.Gender

data class MyProfileResponse(

    val memberId: Long,
    val nickname: String,
    val gender: Gender,
    val birthYear: Int,
    val age: Int,
    val receivedLikeCount: Int,
    val comment: String?,
    val bio: String?,
    val publicPhotos: List<ProfilePhotoResponse>,
    val secretPhotos: List<ProfilePhotoResponse>,
    val noteReceiveEnabled: Boolean,
    val feedNotificationEnabled: Boolean,
)
