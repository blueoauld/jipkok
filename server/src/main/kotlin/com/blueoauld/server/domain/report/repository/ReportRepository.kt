package com.blueoauld.server.domain.report.repository

import com.blueoauld.server.domain.admin.dto.DailyCount
import com.blueoauld.server.domain.report.entity.Report
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface ReportRepository : JpaRepository<Report, Long> {

    fun findTop20ByHandledAtIsNullOrderByIdAsc(): List<Report>

    @Query("select r.id from Report r where r.createdAt < :threshold")
    fun findIdsCreatedBefore(@Param("threshold") threshold: Instant): List<Long>

    fun deleteAllByIdIn(ids: List<Long>)

    fun countByHandledAtIsNull(): Long

    fun findTop5ByOrderByIdDesc(): List<Report>

    @Query(
        value = """
        select cast(created_at at time zone 'Asia/Seoul' as date) as day, count(*) as count
        from report
        where created_at >= :start
        group by day
        """,
        nativeQuery = true,
    )
    fun countDailyCreatedSince(@Param("start") start: Instant): List<DailyCount>
}
