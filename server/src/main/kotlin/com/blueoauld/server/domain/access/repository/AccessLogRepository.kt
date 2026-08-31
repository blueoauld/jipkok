package com.blueoauld.server.domain.access.repository

import com.blueoauld.server.domain.access.entity.AccessLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.time.LocalDate

interface AccessLogRepository : JpaRepository<AccessLog, Long> {

    @Modifying
    @Query(
        value = """
        insert into access_log (member_id, phone_number, platform, device_name, ip_address, accessed_on, app_version, created_at, updated_at)
        values (:memberId, :phoneNumber, :platform, :deviceName, :ipAddress, :accessedOn, :appVersion, :now, :now)
        on conflict (member_id, accessed_on) do update
        set app_version = coalesce(excluded.app_version, access_log.app_version),
            updated_at = excluded.updated_at
        """,
        nativeQuery = true,
    )
    fun upsert(
        @Param("memberId") memberId: Long,
        @Param("phoneNumber") phoneNumber: String,
        @Param("platform") platform: String,
        @Param("deviceName") deviceName: String?,
        @Param("ipAddress") ipAddress: String,
        @Param("accessedOn") accessedOn: LocalDate,
        @Param("appVersion") appVersion: String?,
        @Param("now") now: Instant,
    )

    @Modifying
    @Query("delete from AccessLog l where l.createdAt < :threshold")
    fun deleteAllCreatedBefore(@Param("threshold") threshold: Instant): Int
}
