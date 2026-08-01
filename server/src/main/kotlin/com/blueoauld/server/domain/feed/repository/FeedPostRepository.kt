package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.feed.entity.FeedPost
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface FeedPostRepository : JpaRepository<FeedPost, Long> {

    fun existsByMemberIdAndSlotAt(memberId: Long, slotAt: Instant): Boolean
}
