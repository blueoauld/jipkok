package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.feed.dto.projection.FeedPostRow
import com.blueoauld.server.domain.feed.entity.FeedPost
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface FeedPostRepository : JpaRepository<FeedPost, Long> {

    fun existsByMemberIdAndSlotAt(memberId: Long, slotAt: Instant): Boolean

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from FeedPost p where p.memberId = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)

    @Query(
        value = """
        select p.id as postId,
               p.member_id as memberId,
               p.slot_at as slotAt,
               p.caption as caption,
               p.object_key as objectKey,
               exists (
                 select 1 from feed_post_like l
                 where l.post_id = p.id and l.member_id = :memberId
               ) as likedByMe
        from feed_post p
        join member m on m.id = p.member_id and m.deleted_at is null
        where p.deleted_at is null
          and p.slot_at >= :from and p.slot_at < :to
          and (cast(:gender as varchar) is null or m.gender = cast(:gender as varchar))
          and not exists (
            select 1 from member_block b
            where (b.blocker_id = :memberId and b.blocked_member_id = p.member_id)
               or (b.blocker_id = p.member_id and b.blocked_member_id = :memberId)
          )
          and not exists (
            select 1 from feed_post_report r
            where r.reporter_id = :memberId and r.post_id = p.id
          )
          and (cast(:cursor as bigint) is null or p.id > cast(:cursor as bigint))
        order by p.id
        limit :size
        """,
        nativeQuery = true,
    )
    fun findByDate(
        @Param("memberId") memberId: Long,
        @Param("gender") gender: String?,
        @Param("from") from: Instant,
        @Param("to") to: Instant,
        @Param("cursor") cursor: Long?,
        @Param("size") size: Int,
    ): List<FeedPostRow>

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

    @Query(value = "select id from feed_post where deleted_at < :threshold", nativeQuery = true)
    fun findIdsDeletedBefore(@Param("threshold") threshold: Instant): List<Long>

    @Query(value = "select object_key from feed_post where id in (:postIds)", nativeQuery = true)
    fun findObjectKeysByIdIn(@Param("postIds") postIds: List<Long>): List<String>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from feed_post where id in (:postIds)", nativeQuery = true)
    fun deleteAllByIdIn(@Param("postIds") postIds: List<Long>)
}
