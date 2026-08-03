package com.blueoauld.server.domain.report.repository

import com.blueoauld.server.domain.report.entity.ReportPhoto
import org.springframework.data.jpa.repository.JpaRepository

interface ReportPhotoRepository : JpaRepository<ReportPhoto, Long> {

    fun findByReportIdOrderByDisplayOrder(reportId: Long): List<ReportPhoto>

    fun findAllByReportIdIn(reportIds: List<Long>): List<ReportPhoto>

    fun deleteAllByReportIdIn(reportIds: List<Long>)
}
