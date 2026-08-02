package com.blueoauld.server.domain.feed.dto.response

import java.time.Instant

data class FeedPostResponse(

    val postId: Long,
    val imageUrl: String,
    val slotAt: Instant,
    val caption: String?,
    val likedByMe: Boolean,
    val memberId: Long,
    val nickname: String,
    val profileImageUrl: String?,
)
