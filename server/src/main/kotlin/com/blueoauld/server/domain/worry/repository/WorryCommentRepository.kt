package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.domain.worry.dto.projection.WorryCommentRow
import com.blueoauld.server.domain.worry.entity.WorryComment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface WorryCommentRepository : JpaRepository<WorryComment, Long> {

    @Query(
        value = """
        select anonymous_no from worry_comment
        where post_id = :postId and member_id = :memberId
        order by id
        limit 1
        """,
        nativeQuery = true,
    )
    fun findAnonymousNo(@Param("postId") postId: Long, @Param("memberId") memberId: Long): Int?

    @Query(value = "select max(anonymous_no) from worry_comment where post_id = :postId", nativeQuery = true)
    fun findMaxAnonymousNo(@Param("postId") postId: Long): Int?

    @Query(
        value = "select coalesce(parent_id, id) from worry_comment where id = :commentId",
        nativeQuery = true,
    )
    fun findThreadId(@Param("commentId") commentId: Long): Long?

    @Query(
        value = """
        select c.id as commentId,
               c.member_id as memberId,
               c.content as content,
               c.created_at as createdAt,
               c.anonymous_no as anonymousNo,
               c.parent_id as parentId,
               (c.deleted_at is not null) as deleted,
               c.deleted_by_report as deletedByReport
        from worry_comment c
        where c.post_id = :postId
          and (
            cast(:cursorId as bigint) is null
            or (coalesce(c.parent_id, c.id), c.id) > (cast(:cursorThreadId as bigint), cast(:cursorId as bigint))
          )
        order by coalesce(c.parent_id, c.id), c.id
        limit :size
        """,
        nativeQuery = true,
    )
    fun findByPostIdOldestFirst(
        @Param("postId") postId: Long,
        @Param("cursorThreadId") cursorThreadId: Long?,
        @Param("cursorId") cursorId: Long?,
        @Param("size") size: Int,
    ): List<WorryCommentRow>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from WorryComment c where c.memberId = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)

    @Query(value = "select id from worry_comment where post_id in (:postIds)", nativeQuery = true)
    fun findIdsByPostIdIn(@Param("postIds") postIds: List<Long>): List<Long>

    @Query(value = "select id from worry_comment where deleted_at < :threshold", nativeQuery = true)
    fun findIdsDeletedBefore(@Param("threshold") threshold: Instant): List<Long>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from worry_comment where id in (:commentIds)", nativeQuery = true)
    fun deleteAllByIdIn(@Param("commentIds") commentIds: List<Long>)
}
