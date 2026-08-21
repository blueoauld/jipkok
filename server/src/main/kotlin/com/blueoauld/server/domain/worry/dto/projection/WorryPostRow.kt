package com.blueoauld.server.domain.worry.dto.projection

import java.time.Instant

interface WorryPostRow {

    fun getPostId(): Long

    fun getMemberId(): Long

    fun getContent(): String

    fun getCreatedAt(): Instant

    fun getLikeCount(): Int

    fun getCommentCount(): Int

    fun getLikedByMe(): Boolean
}
