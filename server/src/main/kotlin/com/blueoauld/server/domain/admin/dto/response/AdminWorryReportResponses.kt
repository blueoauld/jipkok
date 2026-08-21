package com.blueoauld.server.domain.admin.dto.response

import java.time.Instant

data class AdminWorryPostReportPageResponse(

    val items: List<AdminWorryPostReportResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminWorryPostReportResponse(

    val postId: Long,
    val authorId: Long,
    val authorNickname: String,
    val content: String,
    val reportCount: Long,
    val postDeletedAt: Instant?,
    val lastReportedAt: Instant,
    val reporters: List<AdminWorryReporterResponse>,
)

data class AdminWorryCommentReportPageResponse(

    val items: List<AdminWorryCommentReportResponse>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
)

data class AdminWorryCommentReportResponse(

    val commentId: Long,
    val postId: Long,
    val authorId: Long,
    val authorNickname: String,
    val content: String,
    val reportCount: Long,
    val commentDeletedAt: Instant?,
    val deletedByReport: Boolean,
    val lastReportedAt: Instant,
    val reporters: List<AdminWorryReporterResponse>,
)

data class AdminWorryReporterResponse(

    val id: Long,
    val nickname: String,
    val reportedAt: Instant,
)
