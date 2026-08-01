package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.feed.entity.FeedPost
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface FeedPostRepository : JpaRepository<FeedPost, Long> {

    fun existsByMemberIdAndSlotAt(memberId: Long, slotAt: Instant): Boolean

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update FeedPost p
        set p.likeCount = p.likeCount + 1
        where p.id = :postId
        """,
    )
    fun increaseLikeCount(@Param("postId") postId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update FeedPost p
        set p.likeCount = p.likeCount - 1
        where p.id = :postId and p.likeCount > 0
        """,
    )
    fun decreaseLikeCount(@Param("postId") postId: Long)
}
