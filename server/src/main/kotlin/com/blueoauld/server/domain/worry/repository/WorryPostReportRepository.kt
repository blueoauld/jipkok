package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.domain.admin.dto.AdminWorryPostRow
import com.blueoauld.server.domain.admin.dto.AdminWorryReporterRow
import com.blueoauld.server.domain.worry.entity.WorryPostReport
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface WorryPostReportRepository : JpaRepository<WorryPostReport, Long> {

    fun existsByReporterIdAndPostId(reporterId: Long, postId: Long): Boolean

    fun countByPostId(postId: Long): Long

    fun deleteAllByPostIdIn(postIds: List<Long>)

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
        where $STATUS $AUTHOR
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
        where $STATUS $AUTHOR
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

    companion object {

        private const val STATUS = """(cast(:status as varchar) is null
            or (:status = 'DELETED' and p.deleted_at is not null)
            or (:status = 'ACTIVE' and p.deleted_at is null))"""

        private const val AUTHOR =
            """and (cast(:authorId as bigint) is null or p.member_id = cast(:authorId as bigint))"""
    }
}
