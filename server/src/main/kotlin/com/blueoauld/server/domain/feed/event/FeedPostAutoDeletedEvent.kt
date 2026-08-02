package com.blueoauld.server.domain.feed.event

import java.time.Instant

data class FeedPostAutoDeletedEvent(

    val postId: Long,
    val memberId: Long,
    val objectKey: String,
    val caption: String?,
    val slotAt: Instant,
    val reportCount: Long,
)
