package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.feed.entity.FeedPostReport
import org.springframework.data.jpa.repository.JpaRepository

interface FeedPostReportRepository : JpaRepository<FeedPostReport, Long> {

    fun existsByReporterIdAndPostId(reporterId: Long, postId: Long): Boolean

    fun countByPostId(postId: Long): Long

    fun deleteAllByPostIdIn(postIds: List<Long>)
}
