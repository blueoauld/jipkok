package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.dto.AdminWorryCommentRow
import com.blueoauld.server.domain.admin.dto.AdminWorryPostRow
import com.blueoauld.server.domain.admin.dto.AdminWorryReporterRow
import com.blueoauld.server.domain.worry.entity.WorryPostReport
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface WorryAdminRepository : JpaRepository<WorryPostReport, Long> {

    @Query(
        value = """
        select p.id as postId,
               p.member_id as authorId,
               p.content as content,
               count(*) as reportCount,
               p.deleted_at as postDeletedAt,
               max(r.created_at) as lastReportedAt
        from worry_post_report r
        join worry_post p on p.id = r.post_id
        where $POST_STATUS $POST_AUTHOR
        group by p.id, p.member_id, p.content, p.deleted_at
        order by max(r.id) desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findPostsForAdmin(
        @Param("status") status: String?,
        @Param("authorId") authorId: Long?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<AdminWorryPostRow>

    @Query(
        value = """
        select count(distinct r.post_id)
        from worry_post_report r
        join worry_post p on p.id = r.post_id
        where $POST_STATUS $POST_AUTHOR
        """,
        nativeQuery = true,
    )
    fun countPostsForAdmin(
        @Param("status") status: String?,
        @Param("authorId") authorId: Long?,
    ): Long

    @Query(
        value = """
        select r.post_id as targetId, r.reporter_id as reporterId, r.created_at as createdAt
        from worry_post_report r
        where r.post_id in (:postIds)
        order by r.id desc
        """,
        nativeQuery = true,
    )
    fun findReportersByPostIdIn(@Param("postIds") postIds: Collection<Long>): List<AdminWorryReporterRow>

    @Query(
        value = """
        select c.id as commentId,
               c.post_id as postId,
               c.member_id as authorId,
               c.content as content,
               count(*) as reportCount,
               c.deleted_at as commentDeletedAt,
               c.deleted_by_report as deletedByReport,
               max(r.created_at) as lastReportedAt
        from worry_comment_report r
        join worry_comment c on c.id = r.comment_id
        where $COMMENT_STATUS $COMMENT_AUTHOR
        group by c.id, c.post_id, c.member_id, c.content, c.deleted_at, c.deleted_by_report
        order by max(r.id) desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findCommentsForAdmin(
        @Param("status") status: String?,
        @Param("authorId") authorId: Long?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<AdminWorryCommentRow>

    @Query(
        value = """
        select count(distinct r.comment_id)
        from worry_comment_report r
        join worry_comment c on c.id = r.comment_id
        where $COMMENT_STATUS $COMMENT_AUTHOR
        """,
        nativeQuery = true,
    )
    fun countCommentsForAdmin(
        @Param("status") status: String?,
        @Param("authorId") authorId: Long?,
    ): Long

    @Query(
        value = """
        select r.comment_id as targetId, r.reporter_id as reporterId, r.created_at as createdAt
        from worry_comment_report r
        where r.comment_id in (:commentIds)
        order by r.id desc
        """,
        nativeQuery = true,
    )
    fun findReportersByCommentIdIn(@Param("commentIds") commentIds: Collection<Long>): List<AdminWorryReporterRow>

    companion object {

        private const val POST_STATUS = """(cast(:status as varchar) is null
            or (:status = 'DELETED' and p.deleted_at is not null)
            or (:status = 'ACTIVE' and p.deleted_at is null))"""

        private const val POST_AUTHOR =
            """and (cast(:authorId as bigint) is null or p.member_id = cast(:authorId as bigint))"""

        private const val COMMENT_STATUS = """(cast(:status as varchar) is null
            or (:status = 'DELETED' and c.deleted_at is not null)
            or (:status = 'ACTIVE' and c.deleted_at is null))"""

        private const val COMMENT_AUTHOR =
            """and (cast(:authorId as bigint) is null or c.member_id = cast(:authorId as bigint))"""
    }
}
