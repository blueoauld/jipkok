package com.blueoauld.server.domain.report.repository

import com.blueoauld.server.domain.admin.dto.DailyCount
import com.blueoauld.server.domain.report.entity.Report
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface ReportRepository : JpaRepository<Report, Long> {

    @Query("select r.id from Report r where r.handledAt is not null and r.createdAt < :threshold")
    fun findHandledIdsCreatedBefore(@Param("threshold") threshold: Instant): List<Long>

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

    @Query(
        value = """
        select r.* from report r
        where (cast(:handled as boolean) is null or (r.handled_at is not null) = cast(:handled as boolean))
          and (cast(:type as varchar) is null or r.type = cast(:type as varchar))
          and (cast(:reason as varchar) is null or r.reason = cast(:reason as varchar))
          and (cast(:reportedMemberId as bigint) is null or r.reported_member_id = cast(:reportedMemberId as bigint))
          and (cast(:reportedPhoneNumber as varchar) is null
            or r.reported_phone_number = cast(:reportedPhoneNumber as varchar))
        order by r.id desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findAllForAdmin(
        @Param("handled") handled: Boolean?,
        @Param("type") type: String?,
        @Param("reason") reason: String?,
        @Param("reportedMemberId") reportedMemberId: Long?,
        @Param("reportedPhoneNumber") reportedPhoneNumber: String?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<Report>

    @Query(
        value = """
        select count(*) from report r
        where (cast(:handled as boolean) is null or (r.handled_at is not null) = cast(:handled as boolean))
          and (cast(:type as varchar) is null or r.type = cast(:type as varchar))
          and (cast(:reason as varchar) is null or r.reason = cast(:reason as varchar))
          and (cast(:reportedMemberId as bigint) is null or r.reported_member_id = cast(:reportedMemberId as bigint))
          and (cast(:reportedPhoneNumber as varchar) is null
            or r.reported_phone_number = cast(:reportedPhoneNumber as varchar))
        """,
        nativeQuery = true,
    )
    fun countForAdmin(
        @Param("handled") handled: Boolean?,
        @Param("type") type: String?,
        @Param("reason") reason: String?,
        @Param("reportedMemberId") reportedMemberId: Long?,
        @Param("reportedPhoneNumber") reportedPhoneNumber: String?,
    ): Long
}
