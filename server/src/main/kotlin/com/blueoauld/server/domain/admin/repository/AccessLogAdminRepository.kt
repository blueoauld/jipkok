package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.access.entity.AccessLog
import com.blueoauld.server.domain.admin.dto.DailyCount
import com.blueoauld.server.domain.admin.dto.PlatformCount
import com.blueoauld.server.domain.admin.dto.VersionCount
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface AccessLogAdminRepository : JpaRepository<AccessLog, Long> {

    @Query(
        """
        select l.accessedOn as day, count(l) as count
        from AccessLog l
        where l.accessedOn >= :start
        group by l.accessedOn
        """,
    )
    fun countDailySince(@Param("start") start: LocalDate): List<DailyCount>

    @Query("select count(distinct l.memberId) from AccessLog l where l.accessedOn >= :start")
    fun countDistinctMembersSince(@Param("start") start: LocalDate): Long

    @Query(
        """
        select l.platform as platform, count(distinct l.memberId) as count
        from AccessLog l
        where l.accessedOn >= :start
        group by l.platform
        """,
    )
    fun countByPlatformSince(@Param("start") start: LocalDate): List<PlatformCount>

    @Query(
        """
        select l.appVersion as version, l.platform as platform, count(distinct l.memberId) as count
        from AccessLog l
        where l.accessedOn >= :start and l.appVersion is not null
        group by l.appVersion, l.platform
        """,
    )
    fun countByVersionSince(@Param("start") start: LocalDate): List<VersionCount>
}
