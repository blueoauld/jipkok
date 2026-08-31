package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.domain.worry.entity.WorryPostReport
import org.springframework.data.jpa.repository.JpaRepository

interface WorryPostReportRepository : JpaRepository<WorryPostReport, Long> {

    fun existsByReporterIdAndPostId(reporterId: Long, postId: Long): Boolean

    fun countByPostId(postId: Long): Long

    fun deleteAllByPostIdIn(postIds: List<Long>)
}
