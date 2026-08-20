package com.blueoauld.server.domain.admin.dto.response

import java.time.Instant

data class AdminFeedReportPageResponse(

    val items: List<AdminFeedReportResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminFeedReportResponse(

    val postId: Long,
    val authorId: Long,
    val authorNickname: String,
    val thumbnailUrl: String,
    val caption: String?,
    val reportCount: Long,
    val postDeletedAt: Instant?,
    val lastReportedAt: Instant,
    val reporters: List<AdminFeedReporterResponse>,
)

data class AdminFeedReporterResponse(

    val id: Long,
    val nickname: String,
    val reportedAt: Instant,
)
