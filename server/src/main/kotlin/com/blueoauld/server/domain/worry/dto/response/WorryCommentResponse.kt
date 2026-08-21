package com.blueoauld.server.domain.worry.dto.response

import java.time.Instant

data class WorryCommentResponse(

    val commentId: Long,
    val content: String,
    val createdAt: Instant,
    val anonymousNo: Int,
    val byAuthor: Boolean,
    val mine: Boolean,
)
