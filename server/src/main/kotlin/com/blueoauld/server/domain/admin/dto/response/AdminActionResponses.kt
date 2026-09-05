package com.blueoauld.server.domain.admin.dto.response

import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import java.time.Instant

data class AdminActionPageResponse(

    val items: List<AdminActionResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminActionResponse(

    val id: Long,
    val actorId: Long,
    val actorNickname: String,
    val action: AdminActionType,
    val targetId: Long,
    val detail: String?,
    val createdAt: Instant,
)
