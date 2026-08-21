package com.blueoauld.server.domain.admin.dto

import java.time.Instant

interface AdminWorryPostRow {

    val postId: Long
    val authorId: Long
    val content: String
    val reportCount: Long
    val postDeletedAt: Instant?
    val lastReportedAt: Instant
}

interface AdminWorryCommentRow {

    val commentId: Long
    val postId: Long
    val authorId: Long
    val content: String
    val reportCount: Long
    val commentDeletedAt: Instant?
    val deletedByReport: Boolean
    val lastReportedAt: Instant
}

interface AdminWorryReporterRow {

    val targetId: Long
    val reporterId: Long
    val createdAt: Instant
}
