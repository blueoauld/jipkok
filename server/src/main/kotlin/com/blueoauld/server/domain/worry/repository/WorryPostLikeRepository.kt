package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.domain.worry.entity.WorryPostLike
import org.springframework.data.jpa.repository.JpaRepository

interface WorryPostLikeRepository : JpaRepository<WorryPostLike, Long> {

    fun existsByPostIdAndMemberId(postId: Long, memberId: Long): Boolean

    fun deleteByPostIdAndMemberId(postId: Long, memberId: Long): Long

    fun deleteAllByMemberId(memberId: Long)

    fun deleteAllByPostIdIn(postIds: List<Long>)
}
