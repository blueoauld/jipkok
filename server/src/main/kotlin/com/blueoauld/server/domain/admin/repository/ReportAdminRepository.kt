package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.dto.projection.DailyCount
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.global.time.KOREA_ID
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface ReportAdminRepository : JpaRepository<Report, Long> {

    fun countByHandledAtIsNull(): Long

    fun findTop5ByOrderByIdDesc(): List<Report>

    @Query(
        value = """
        select cast(created_at at time zone '$KOREA_ID' as date) as day, count(*) as count
        from report
        where created_at >= :start
        group by day
        """,
        nativeQuery = true,
    )
    fun countDailyCreatedSince(@Param("start") start: Instant): List<DailyCount>

    @Query(
        value = """
        select r.* from report r
        where $HANDLED $TYPE $REASON $REPORTER $REPORTED
        order by r.id desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findAllForAdmin(
        @Param("handled") handled: Boolean?,
        @Param("type") type: String?,
        @Param("reason") reason: String?,
        @Param("reporterId") reporterId: Long?,
        @Param("reportedMemberId") reportedMemberId: Long?,
        @Param("reportedPhoneNumber") reportedPhoneNumber: String?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<Report>

    @Query(
        value = """
        select count(*) from report r
        where $HANDLED $TYPE $REASON $REPORTER $REPORTED
        """,
        nativeQuery = true,
    )
    fun countForAdmin(
        @Param("handled") handled: Boolean?,
        @Param("type") type: String?,
        @Param("reason") reason: String?,
        @Param("reporterId") reporterId: Long?,
        @Param("reportedMemberId") reportedMemberId: Long?,
        @Param("reportedPhoneNumber") reportedPhoneNumber: String?,
    ): Long

    companion object {

        private const val HANDLED =
            """(cast(:handled as boolean) is null or (r.handled_at is not null) = cast(:handled as boolean))"""

        private const val TYPE = """and (cast(:type as varchar) is null or r.type = cast(:type as varchar))"""

        private const val REASON = """and (cast(:reason as varchar) is null or r.reason = cast(:reason as varchar))"""

        private const val REPORTER =
            """and (cast(:reporterId as bigint) is null or r.reporter_id = cast(:reporterId as bigint))"""

        private const val REPORTED =
            """and (cast(:reportedMemberId as bigint) is null
              or r.reported_member_id = cast(:reportedMemberId as bigint))
          and (cast(:reportedPhoneNumber as varchar) is null
            or r.reported_phone_number = cast(:reportedPhoneNumber as varchar))"""
    }
}
