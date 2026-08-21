package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.domain.worry.entity.WorryCommentReport
import org.springframework.data.jpa.repository.JpaRepository

interface WorryCommentReportRepository : JpaRepository<WorryCommentReport, Long> {

    fun existsByReporterIdAndCommentId(reporterId: Long, commentId: Long): Boolean

    fun countByCommentId(commentId: Long): Long

    fun deleteAllByCommentIdIn(commentIds: List<Long>)
}
