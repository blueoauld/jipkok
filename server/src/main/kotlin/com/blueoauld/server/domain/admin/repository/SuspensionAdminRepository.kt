package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface SuspensionAdminRepository : JpaRepository<MemberSuspension, Long> {

    fun findTop5ByOrderByIdDesc(): List<MemberSuspension>

    @Query(
        """
        select count(distinct s.phoneNumber)
        from MemberSuspension s
        where s.releasedAt is null and (s.expiresAt is null or s.expiresAt > :now)
        """,
    )
    fun countSuspendedMembers(@Param("now") now: Instant): Long

    @Query(
        value = """
        select s.* from member_suspension s
        where $STATUS $TYPE $MEMBER
        order by s.id desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findAllForAdmin(
        @Param("status") status: String?,
        @Param("type") type: String?,
        @Param("memberId") memberId: Long?,
        @Param("now") now: Instant,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<MemberSuspension>

    @Query(
        value = """
        select count(*) from member_suspension s
        where $STATUS $TYPE $MEMBER
        """,
        nativeQuery = true,
    )
    fun countForAdmin(
        @Param("status") status: String?,
        @Param("type") type: String?,
        @Param("memberId") memberId: Long?,
        @Param("now") now: Instant,
    ): Long

    companion object {

        private const val STATUS = """(cast(:status as varchar) is null
            or (:status = 'RELEASED' and s.released_at is not null)
            or (:status = 'EXPIRED' and s.released_at is null
                and s.expires_at is not null and s.expires_at <= :now)
            or (:status = 'ACTIVE' and s.released_at is null
                and (s.expires_at is null or s.expires_at > :now)))"""

        private const val TYPE = """and (cast(:type as varchar) is null or s.type = cast(:type as varchar))"""

        private const val MEMBER = """and (cast(:memberId as bigint) is null
            or s.member_id = cast(:memberId as bigint)
            or s.phone_number = (select m.phone_number from member m where m.id = cast(:memberId as bigint)))"""
    }
}
