package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.domain.worry.dto.projection.WorryCommentRow
import com.blueoauld.server.domain.worry.entity.WorryComment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface WorryCommentRepository : JpaRepository<WorryComment, Long> {

    fun findFirstByPostIdAndMemberId(postId: Long, memberId: Long): WorryComment?

    @Query("select max(c.anonymousNo) from WorryComment c where c.postId = :postId")
    fun findMaxAnonymousNo(@Param("postId") postId: Long): Int?

    @Query(
        value = """
        select c.id as commentId,
               c.member_id as memberId,
               c.content as content,
               c.created_at as createdAt,
               c.anonymous_no as anonymousNo
        from worry_comment c
        where c.deleted_at is null
          and c.post_id = :postId
          and (cast(:cursor as bigint) is null or c.id > cast(:cursor as bigint))
        order by c.id
        limit :size
        """,
        nativeQuery = true,
    )
    fun findByPostIdOldestFirst(
        @Param("postId") postId: Long,
        @Param("cursor") cursor: Long?,
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
