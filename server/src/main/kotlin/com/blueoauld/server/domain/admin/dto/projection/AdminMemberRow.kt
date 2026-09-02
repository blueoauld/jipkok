package com.blueoauld.server.domain.admin.dto.projection

import java.time.Instant

interface AdminMemberRow {

    val id: Long
    val nickname: String
    val phoneNumber: String
    val gender: String
    val birthYear: Int
    val comment: String?
    val bio: String?
    val receivedLikeCount: Int
    val pointBalance: Int
    val noteReceiveEnabled: Boolean
    val latitude: Double?
    val longitude: Double?
    val locatedAt: Instant?
    val joinedAt: Instant
    val withdrawnAt: Instant?
}
