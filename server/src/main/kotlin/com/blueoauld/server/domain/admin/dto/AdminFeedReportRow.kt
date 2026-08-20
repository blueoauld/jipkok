package com.blueoauld.server.domain.admin.dto

import java.time.Instant

interface AdminFeedReportRow {

    val id: Long
    val reporterId: Long
    val postId: Long
    val authorId: Long
    val objectKey: String
    val caption: String?
    val postReportCount: Long
    val postDeletedAt: Instant?
    val createdAt: Instant
}
