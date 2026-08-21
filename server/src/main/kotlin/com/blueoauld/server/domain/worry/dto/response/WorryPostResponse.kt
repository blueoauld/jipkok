package com.blueoauld.server.domain.worry.dto.response

import java.time.Instant

data class WorryPostResponse(

    val worryId: Long,
    val content: String,
    val createdAt: Instant,
    val likeCount: Int,
    val commentCount: Int,
    val likedByMe: Boolean,
    val mine: Boolean,
)
