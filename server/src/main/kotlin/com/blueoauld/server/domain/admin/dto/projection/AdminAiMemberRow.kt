package com.blueoauld.server.domain.admin.dto.projection

import java.time.Instant

interface AdminAiMemberRow {

    val id: Long
    val nickname: String
    val gender: String
    val birthYear: Int
    val enabled: Boolean
    val publicPhotoCount: Long
    val locatedAt: Instant?
    val createdAt: Instant
}
