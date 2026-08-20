package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.admin.dto.AdminFeedPostRow
import com.blueoauld.server.domain.admin.dto.AdminFeedReporterRow
import com.blueoauld.server.domain.feed.entity.FeedPostReport
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface FeedPostReportRepository : JpaRepository<FeedPostReport, Long> {

    fun existsByReporterIdAndPostId(reporterId: Long, postId: Long): Boolean

    fun countByPostId(postId: Long): Long

    fun deleteAllByPostIdIn(postIds: List<Long>)

    @Query(
        value = """
        select fp.id as postId,
               fp.member_id as authorId,
               fp.object_key as objectKey,
               fp.caption as caption,
               count(*) as reportCount,
               fp.deleted_at as postDeletedAt,
               max(fpr.created_at) as lastReportedAt
        from feed_post_report fpr
        join feed_post fp on fp.id = fpr.post_id
        where $STATUS $AUTHOR
        group by fp.id, fp.member_id, fp.object_key, fp.caption, fp.deleted_at
        order by max(fpr.id) desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findPostsForAdmin(
        @Param("status") status: String?,
        @Param("authorId") authorId: Long?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<AdminFeedPostRow>

    @Query(
        value = """
        select count(distinct fpr.post_id)
        from feed_post_report fpr
        join feed_post fp on fp.id = fpr.post_id
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
        select fpr.post_id as postId, fpr.reporter_id as reporterId, fpr.created_at as createdAt
        from feed_post_report fpr
        where fpr.post_id in (:postIds)
        order by fpr.id desc
        """,
        nativeQuery = true,
    )
    fun findReportersByPostIdIn(@Param("postIds") postIds: Collection<Long>): List<AdminFeedReporterRow>

    companion object {

        private const val STATUS = """(cast(:status as varchar) is null
            or (:status = 'DELETED' and fp.deleted_at is not null)
            or (:status = 'ACTIVE' and fp.deleted_at is null))"""

        private const val AUTHOR =
            """and (cast(:authorId as bigint) is null or fp.member_id = cast(:authorId as bigint))"""
    }
}
