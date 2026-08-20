package com.blueoauld.server.domain.suspension.repository

import com.blueoauld.server.domain.suspension.entity.MemberSuspension
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface MemberSuspensionRepository : JpaRepository<MemberSuspension, Long> {

    fun findByPhoneNumberOrderByIdDesc(phoneNumber: String): List<MemberSuspension>

    @Query(
        """
        select s
        from MemberSuspension s, Member m
        where m.id = :memberId
          and s.phoneNumber = m.phoneNumber
          and s.releasedAt is null
          and (s.expiresAt is null or s.expiresAt > :now)
        order by s.type
        """,
    )
    fun findActive(@Param("memberId") memberId: Long, @Param("now") now: Instant): List<MemberSuspension>

    @Query(
        """
        select count(s) > 0
        from MemberSuspension s
        where s.phoneNumber = :phoneNumber
          and s.type = :type
          and s.releasedAt is null
          and (s.expiresAt is null or s.expiresAt > :now)
        """,
    )
    fun existsActiveByPhoneNumber(
        @Param("phoneNumber") phoneNumber: String,
        @Param("type") type: SuspensionType,
        @Param("now") now: Instant,
    ): Boolean

    @Query(
        """
        select count(s) > 0
        from MemberSuspension s, Member m
        where m.id = :memberId
          and s.phoneNumber = m.phoneNumber
          and s.type = :type
          and s.releasedAt is null
          and (s.expiresAt is null or s.expiresAt > :now)
        """,
    )
    fun existsActive(
        @Param("memberId") memberId: Long,
        @Param("type") type: SuspensionType,
        @Param("now") now: Instant,
    ): Boolean

    @Query(
        """
        select s.id from MemberSuspension s
        where (s.releasedAt is not null and s.releasedAt < :threshold)
           or (s.releasedAt is null and s.expiresAt is not null and s.expiresAt < :threshold)
        """,
    )
    fun findIdsExpiredBefore(@Param("threshold") threshold: Instant): List<Long>

    fun deleteAllByIdIn(ids: List<Long>)

    @Query(
        """
        select count(distinct s.memberId)
        from MemberSuspension s
        where s.releasedAt is null and (s.expiresAt is null or s.expiresAt > :now)
        """,
    )
    fun countSuspendedMembers(@Param("now") now: Instant): Long

    fun findTop5ByOrderByIdDesc(): List<MemberSuspension>

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

        private const val MEMBER =
            """and (cast(:memberId as bigint) is null or s.member_id = cast(:memberId as bigint))"""
    }
}
