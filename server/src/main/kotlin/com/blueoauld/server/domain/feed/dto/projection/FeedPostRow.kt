package com.blueoauld.server.domain.feed.dto.projection

import java.time.Instant

interface FeedPostRow {

    fun getPostId(): Long

    fun getMemberId(): Long

    fun getSlotAt(): Instant

    fun getCaption(): String?

    fun getObjectKey(): String

    fun getLikedByMe(): Boolean
}
