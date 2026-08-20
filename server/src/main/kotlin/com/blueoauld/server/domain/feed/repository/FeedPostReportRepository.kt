package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.admin.dto.AdminFeedReportRow
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
        select fpr.id as id,
               fpr.reporter_id as reporterId,
               fp.id as postId,
               fp.member_id as authorId,
               fp.object_key as objectKey,
               fp.caption as caption,
               (select count(*) from feed_post_report r where r.post_id = fp.id) as postReportCount,
               fp.deleted_at as postDeletedAt,
               fpr.created_at as createdAt
        from feed_post_report fpr
        join feed_post fp on fp.id = fpr.post_id
        where $STATUS $AUTHOR
        order by fpr.id desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findAllForAdmin(
        @Param("status") status: String?,
        @Param("authorId") authorId: Long?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<AdminFeedReportRow>

    @Query(
        value = """
        select count(*)
        from feed_post_report fpr
        join feed_post fp on fp.id = fpr.post_id
        where $STATUS $AUTHOR
        """,
        nativeQuery = true,
    )
    fun countForAdmin(
        @Param("status") status: String?,
        @Param("authorId") authorId: Long?,
    ): Long

    companion object {

        private const val STATUS = """(cast(:status as varchar) is null
            or (:status = 'DELETED' and fp.deleted_at is not null)
            or (:status = 'ACTIVE' and fp.deleted_at is null))"""

        private const val AUTHOR =
            """and (cast(:authorId as bigint) is null or fp.member_id = cast(:authorId as bigint))"""
    }
}
