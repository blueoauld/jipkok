package com.blueoauld.server.domain.admin.dto.projection

import java.time.Instant

interface AdminMemberListRow {

    val id: Long
    val nickname: String
    val gender: String
    val role: String
    val birthYear: Int
    val phoneNumber: String
    val publicPhotoCount: Long
    val secretPhotoCount: Long
    val suspended: Boolean
    val withdrawnAt: Instant?
    val joinedAt: Instant
}
