package com.blueoauld.server.domain.admin.dto.response

import java.time.Instant

data class AdminFeedReportPageResponse(

    val items: List<AdminFeedReportResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminFeedReportResponse(

    val id: Long,
    val reporterId: Long,
    val reporterNickname: String,
    val postId: Long,
    val authorId: Long,
    val authorNickname: String,
    val thumbnailUrl: String,
    val caption: String?,
    val postReportCount: Long,
    val postDeletedAt: Instant?,
    val createdAt: Instant,
)
