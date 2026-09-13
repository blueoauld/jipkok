package com.blueoauld.server.domain.profileview.repository

import com.blueoauld.server.domain.block.repository.ContactBlockRepository.Companion.NOT_CONTACT_BLOCKED
import com.blueoauld.server.domain.profileview.entity.ProfileView
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

    @Query(
        value = """
        select v.* from profile_view v
        join member m on m.id = v.viewer_id
        where v.viewed_member_id = :memberId
          and $NOT_CONTACT_BLOCKED
        order by v.viewed_at desc, v.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findVisibleFirstPage(@Param("memberId") memberId: Long, @Param("size") size: Int): List<ProfileView>

    @Query(
        value = """
        select v.* from profile_view v
        join member m on m.id = v.viewer_id
        where v.viewed_member_id = :memberId
          and (v.viewed_at < :viewedAt or (v.viewed_at = :viewedAt and v.id < :id))
          and $NOT_CONTACT_BLOCKED
        order by v.viewed_at desc, v.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findVisibleNextPage(
        @Param("memberId") memberId: Long,
        @Param("viewedAt") viewedAt: Instant,
        @Param("id") id: Long,
        @Param("size") size: Int,
    ): List<ProfileView>

    @Query(
        value = """
        select count(*) from profile_view v
        join member m on m.id = v.viewer_id
        where v.viewed_member_id = :memberId
          and $NOT_CONTACT_BLOCKED
        """,
        nativeQuery = true,
    )
    fun countVisibleViews(@Param("memberId") memberId: Long): Int

    @Query(
        value = """
        select count(*) from profile_view v
        join member m on m.id = v.viewer_id
        where v.viewed_member_id = :memberId
          and v.viewed_at > :viewedAt
          and $NOT_CONTACT_BLOCKED
        """,
        nativeQuery = true,
    )
    fun countVisibleViewsAfter(@Param("memberId") memberId: Long, @Param("viewedAt") viewedAt: Instant): Int
}
