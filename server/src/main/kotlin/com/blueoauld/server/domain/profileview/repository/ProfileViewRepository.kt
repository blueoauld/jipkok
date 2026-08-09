package com.blueoauld.server.domain.profileview.repository

import com.blueoauld.server.domain.profileview.entity.ProfileView
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface ProfileViewRepository : JpaRepository<ProfileView, Long> {

    fun findByViewerIdAndViewedMemberId(viewerId: Long, viewedMemberId: Long): ProfileView?

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ProfileView v where v.viewerId = :memberId or v.viewedMemberId = :memberId")
    fun deleteAllByMember(@Param("memberId") memberId: Long)

    fun findByViewedMemberIdOrderByViewedAtDescIdDesc(viewedMemberId: Long, limit: Limit): List<ProfileView>

    @Query(
        """
        select v from ProfileView v
        where v.viewedMemberId = :viewedMemberId
            and (v.viewedAt < :viewedAt or (v.viewedAt = :viewedAt and v.id < :id))
        order by v.viewedAt desc, v.id desc
        """,
    )
    fun findNextPage(
        @Param("viewedMemberId") viewedMemberId: Long,
        @Param("viewedAt") viewedAt: Instant,
        @Param("id") id: Long,
        limit: Limit,
    ): List<ProfileView>
}
