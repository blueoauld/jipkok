package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.domain.worry.dto.projection.WorryPostRow
import com.blueoauld.server.domain.worry.entity.WorryPost
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface WorryPostRepository : JpaRepository<WorryPost, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from WorryPost p where p.id = :postId")
    fun findLockedById(@Param("postId") postId: Long): WorryPost?

    @Query(
        value = """
        select count(*) from worry_post
        where member_id = :memberId
          and created_at >= :from and created_at < :to
        """,
        nativeQuery = true,
    )
    fun countByMemberIdBetween(
        @Param("memberId") memberId: Long,
        @Param("from") from: Instant,
        @Param("to") to: Instant,
    ): Long

    @Query(value = "select like_count from worry_post where id = :postId", nativeQuery = true)
    fun findLikeCountById(@Param("postId") postId: Long): Int?

    @Query(value = "select comment_count from worry_post where id = :postId", nativeQuery = true)
    fun findCommentCountById(@Param("postId") postId: Long): Int?

    @Query(
        value = """
        select p.id as postId,
               p.member_id as memberId,
               p.content as content,
               p.created_at as createdAt,
               p.like_count as likeCount,
               p.comment_count as commentCount,
               exists (
                 select 1 from worry_post_like l
                 where l.post_id = p.id and l.member_id = :memberId
               ) as likedByMe
        from worry_post p
        where p.deleted_at is null
          and not exists (
            select 1 from worry_post_report r
            where r.reporter_id = :memberId and r.post_id = p.id
          )
          and (cast(:cursor as bigint) is null or p.id < cast(:cursor as bigint))
        order by p.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findLatestFirst(
        @Param("memberId") memberId: Long,
        @Param("cursor") cursor: Long?,
        @Param("size") size: Int,
    ): List<WorryPostRow>

    @Query(
        value = """
        select p.id as postId,
               p.member_id as memberId,
               p.content as content,
               p.created_at as createdAt,
               p.like_count as likeCount,
               p.comment_count as commentCount,
               exists (
                 select 1 from worry_post_like l
                 where l.post_id = p.id and l.member_id = :memberId
               ) as likedByMe
        from worry_post p
        where p.deleted_at is null
          and not exists (
            select 1 from worry_post_report r
            where r.reporter_id = :memberId and r.post_id = p.id
          )
          and (
            cast(:cursorId as bigint) is null
            or (p.like_count, p.id) < (cast(:cursorLikeCount as integer), cast(:cursorId as bigint))
          )
        order by p.like_count desc, p.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findMostLikedFirst(
        @Param("memberId") memberId: Long,
        @Param("cursorLikeCount") cursorLikeCount: Int?,
        @Param("cursorId") cursorId: Long?,
        @Param("size") size: Int,
    ): List<WorryPostRow>

    @Query(
        value = """
        select p.id as postId,
               p.member_id as memberId,
               p.content as content,
               p.created_at as createdAt,
               p.like_count as likeCount,
               p.comment_count as commentCount,
               exists (
                 select 1 from worry_post_like l
                 where l.post_id = p.id and l.member_id = :memberId
               ) as likedByMe
        from worry_post p
        where p.deleted_at is null
          and not exists (
            select 1 from worry_post_report r
            where r.reporter_id = :memberId and r.post_id = p.id
          )
          and (
            cast(:cursorId as bigint) is null
            or (p.comment_count, p.id) < (cast(:cursorCommentCount as integer), cast(:cursorId as bigint))
          )
        order by p.comment_count desc, p.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findMostCommentedFirst(
        @Param("memberId") memberId: Long,
        @Param("cursorCommentCount") cursorCommentCount: Int?,
        @Param("cursorId") cursorId: Long?,
        @Param("size") size: Int,
    ): List<WorryPostRow>

    @Query(
        value = """
        select p.id as postId,
               p.member_id as memberId,
               p.content as content,
               p.created_at as createdAt,
               p.like_count as likeCount,
               p.comment_count as commentCount,
               exists (
                 select 1 from worry_post_like l
                 where l.post_id = p.id and l.member_id = :memberId
               ) as likedByMe
        from worry_post p
        where p.deleted_at is null
          and p.content ilike :keyword escape '\'
          and not exists (
            select 1 from worry_post_report r
            where r.reporter_id = :memberId and r.post_id = p.id
          )
          and (cast(:cursor as bigint) is null or p.id < cast(:cursor as bigint))
        order by p.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun search(
        @Param("memberId") memberId: Long,
        @Param("keyword") keyword: String,
        @Param("cursor") cursor: Long?,
        @Param("size") size: Int,
    ): List<WorryPostRow>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update WorryPost p
        set p.likeCount = p.likeCount + 1
        where p.id = :postId
        """,
    )
    fun increaseLikeCount(@Param("postId") postId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update WorryPost p
        set p.likeCount = p.likeCount - 1
        where p.id = :postId and p.likeCount > 0
        """,
    )
    fun decreaseLikeCount(@Param("postId") postId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update WorryPost p
        set p.commentCount = p.commentCount + 1
        where p.id = :postId
        """,
    )
    fun increaseCommentCount(@Param("postId") postId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update WorryPost p
        set p.commentCount = p.commentCount - 1
        where p.id = :postId and p.commentCount > 0
        """,
    )
    fun decreaseCommentCount(@Param("postId") postId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update WorryPost p
        set p.likeCount = p.likeCount - 1
        where p.likeCount > 0
          and p.id in (select l.postId from WorryPostLike l where l.memberId = :memberId)
        """,
    )
    fun decreaseLikeCountLikedBy(@Param("memberId") memberId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = """
        update worry_post p
        set comment_count = greatest(comment_count - sub.count, 0)
        from (
          select post_id, count(*) as count
          from worry_comment
          where member_id = :memberId and deleted_at is null
          group by post_id
        ) sub
        where p.id = sub.post_id
        """,
        nativeQuery = true,
    )
    fun decreaseCommentCountCommentedBy(@Param("memberId") memberId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from WorryPost p where p.memberId = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)

    @Query(value = "select id from worry_post where deleted_at < :threshold", nativeQuery = true)
    fun findIdsDeletedBefore(@Param("threshold") threshold: Instant): List<Long>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from worry_post where id in (:postIds)", nativeQuery = true)
    fun deleteAllByIdIn(@Param("postIds") postIds: List<Long>)
}
