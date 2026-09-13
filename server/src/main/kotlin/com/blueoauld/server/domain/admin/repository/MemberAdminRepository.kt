package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.admin.dto.projection.AdminMemberListRow
import com.blueoauld.server.domain.admin.dto.projection.AdminMemberRow
import com.blueoauld.server.domain.admin.dto.projection.DailyCount
import com.blueoauld.server.domain.admin.dto.projection.GenderBirthYearCount
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.global.time.KOREA_ID
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface MemberAdminRepository : JpaRepository<Member, Long> {

    @Query(
        value = """
        select m.id as id,
               m.nickname as nickname,
               m.gender as gender,
               m.birth_year as birthYear,
               m.phone_number as phoneNumber,
               (select count(*) from member_photo p where p.member_id = m.id and p.visibility = 'PUBLIC')
                 as publicPhotoCount,
               (select count(*) from member_photo p where p.member_id = m.id and p.visibility = 'SECRET')
                 as secretPhotoCount,
               $ACTIVE_SUSPENSION as suspended,
               m.deleted_at as withdrawnAt,
               m.created_at as joinedAt
        from member m
        join (
            select m.id
            from member m
            where $STATUS $GENDER $KEYWORD
            order by m.id desc
            limit :size offset :offset
        ) page on page.id = m.id
        order by m.id desc
        """,
        nativeQuery = true,
    )
    fun findAllForAdmin(
        @Param("status") status: String?,
        @Param("gender") gender: String?,
        @Param("keywordId") keywordId: Long?,
        @Param("phoneLike") phoneLike: String?,
        @Param("nicknameLike") nicknameLike: String?,
        @Param("now") now: Instant,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<AdminMemberListRow>

    @Query(
        value = """
        select count(*)
        from member m
        where $STATUS $GENDER $KEYWORD
        """,
        nativeQuery = true,
    )
    fun countForAdmin(
        @Param("status") status: String?,
        @Param("gender") gender: String?,
        @Param("keywordId") keywordId: Long?,
        @Param("phoneLike") phoneLike: String?,
        @Param("nicknameLike") nicknameLike: String?,
        @Param("now") now: Instant,
    ): Long

    @Query(
        value = """
        select m.id as id,
               m.nickname as nickname,
               m.phone_number as phoneNumber,
               m.gender as gender,
               m.birth_year as birthYear,
               m.comment as comment,
               m.bio as bio,
               m.received_like_count as receivedLikeCount,
               m.point_balance as pointBalance,
               m.note_receive_enabled as noteReceiveEnabled,
               m.latitude as latitude,
               m.longitude as longitude,
               m.located_at as locatedAt,
               m.created_at as joinedAt,
               m.deleted_at as withdrawnAt
        from member m
        where m.id = :memberId
        """,
        nativeQuery = true,
    )
    fun findRowById(@Param("memberId") memberId: Long): AdminMemberRow?

    @Query(value = "select count(*) from member where created_at >= :start", nativeQuery = true)
    fun countCreatedSince(@Param("start") start: Instant): Long

    @Query(value = "select count(*) from member where deleted_at >= :start", nativeQuery = true)
    fun countDeletedSince(@Param("start") start: Instant): Long

    @Query(
        value = """
        select cast(created_at at time zone '$KOREA_ID' as date) as day, count(*) as count
        from member
        where created_at >= :start
        group by day
        """,
        nativeQuery = true,
    )
    fun countDailyCreatedSince(@Param("start") start: Instant): List<DailyCount>

    @Query(
        value = """
        select cast(deleted_at at time zone '$KOREA_ID' as date) as day, count(*) as count
        from member
        where deleted_at >= :start
        group by day
        """,
        nativeQuery = true,
    )
    fun countDailyDeletedSince(@Param("start") start: Instant): List<DailyCount>

    @Query(
        value = """
        select gender as gender, birth_year as birthYear, count(*) as count
        from member
        where deleted_at is null
        group by gender, birth_year
        """,
        nativeQuery = true,
    )
    fun countByGenderAndBirthYear(): List<GenderBirthYearCount>

    companion object {

        private const val ACTIVE_SUSPENSION = """exists(
            select 1 from member_suspension s
            where s.phone_number = m.phone_number
              and s.type = 'SERVICE'
              and s.released_at is null
              and (s.expires_at is null or s.expires_at > :now))"""

        private const val STATUS = """(cast(:status as varchar) is null
            or (:status = 'WITHDRAWN' and m.deleted_at is not null)
            or (:status = 'NORMAL' and m.deleted_at is null and not $ACTIVE_SUSPENSION)
            or (:status = 'SUSPENDED' and m.deleted_at is null and $ACTIVE_SUSPENSION))"""

        private const val GENDER = """and (cast(:gender as varchar) is null or m.gender = cast(:gender as varchar))"""

        private const val KEYWORD = """and (cast(:keywordId as bigint) is null
            or m.id = cast(:keywordId as bigint)
            or m.phone_number like cast(:phoneLike as varchar))
          and (cast(:nicknameLike as varchar) is null or m.nickname ilike cast(:nicknameLike as varchar))"""
    }
}
