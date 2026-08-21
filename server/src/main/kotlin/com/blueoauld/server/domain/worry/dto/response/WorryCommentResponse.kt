package com.blueoauld.server.domain.worry.dto.response

import com.blueoauld.server.domain.worry.entity.type.WorryCommentStatus
import java.time.Instant

data class WorryCommentResponse(

    val commentId: Long,
    val content: String?,
    val createdAt: Instant,
    val anonymousNo: Int,
    val byAuthor: Boolean,
    val mine: Boolean,
    val status: WorryCommentStatus,
)
