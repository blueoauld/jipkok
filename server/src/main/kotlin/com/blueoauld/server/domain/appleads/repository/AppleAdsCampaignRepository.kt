package com.blueoauld.server.domain.appleads.repository

import com.blueoauld.server.domain.appleads.entity.AppleAdsCampaign
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface AppleAdsCampaignRepository : JpaRepository<AppleAdsCampaign, Long> {

    @Modifying
    @Query(
        value = """
        insert into apple_ads_campaign (id, name, status, deleted, created_at, updated_at)
        values (:id, :name, :status, :deleted, :now, :now)
        on conflict (id) do update
        set name = excluded.name,
            status = excluded.status,
            deleted = excluded.deleted,
            updated_at = excluded.updated_at
        """,
        nativeQuery = true,
    )
    fun upsert(
        @Param("id") id: Long,
        @Param("name") name: String,
        @Param("status") status: String?,
        @Param("deleted") deleted: Boolean,
        @Param("now") now: Instant,
    )
}
