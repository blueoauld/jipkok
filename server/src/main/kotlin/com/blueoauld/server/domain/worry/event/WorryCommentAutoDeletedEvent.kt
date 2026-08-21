package com.blueoauld.server.domain.worry.event

import java.time.Instant

data class WorryCommentAutoDeletedEvent(

    val commentId: Long,
    val postId: Long,
    val memberId: Long,
    val content: String,
    val createdAt: Instant,
    val reportCount: Long,
)
