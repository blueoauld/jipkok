package com.blueoauld.server.domain.report.repository

import com.blueoauld.server.domain.report.entity.Report
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface ReportRepository : JpaRepository<Report, Long> {

    @Query("select r.id from Report r where r.handledAt is not null and r.createdAt < :threshold")
    fun findHandledIdsCreatedBefore(@Param("threshold") threshold: Instant): List<Long>

    fun deleteAllByIdIn(ids: List<Long>)
}
