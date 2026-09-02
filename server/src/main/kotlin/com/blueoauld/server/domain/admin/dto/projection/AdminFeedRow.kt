package com.blueoauld.server.domain.admin.dto.projection

import java.time.Instant

interface AdminFeedPostRow {

    val postId: Long
    val authorId: Long
    val objectKey: String
    val caption: String?
    val reportCount: Long
    val postDeletedAt: Instant?
    val lastReportedAt: Instant
}

interface AdminFeedReporterRow {

    val postId: Long
    val reporterId: Long
    val createdAt: Instant
}
