package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.feed.entity.FeedPostLike
import org.springframework.data.jpa.repository.JpaRepository

interface FeedPostLikeRepository : JpaRepository<FeedPostLike, Long> {

    fun existsByPostIdAndMemberId(postId: Long, memberId: Long): Boolean

    fun deleteByPostIdAndMemberId(postId: Long, memberId: Long): Long
}
