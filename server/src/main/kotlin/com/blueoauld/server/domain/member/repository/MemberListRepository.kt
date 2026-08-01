package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.domain.member.dto.projection.MemberListRow
import com.blueoauld.server.domain.member.entity.Member
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MemberListRepository : JpaRepository<Member, Long> {

    @Query(
        value = """
        select m.id as memberId,
               extract(epoch from m.located_at) as orderValue,
               m.located_at as locatedAt,
               $DISTANCE as distance
        from member m
        where $VISIBLE
          and m.located_at is not null
          and (
            cast(:cursorValue as double precision) is null
            or extract(epoch from m.located_at) < cast(:cursorValue as double precision)
            or (
              extract(epoch from m.located_at) = cast(:cursorValue as double precision)
              and m.id < cast(:cursorId as bigint)
            )
          )
        order by orderValue desc, m.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findRecent(
        @Param("memberId") memberId: Long,
        @Param("gender") gender: String?,
        @Param("latitude") latitude: Double?,
        @Param("longitude") longitude: Double?,
        @Param("cursorValue") cursorValue: Double?,
        @Param("cursorId") cursorId: Long?,
        @Param("size") size: Int,
    ): List<MemberListRow>

    @Query(
        value = """
        select m.id as memberId,
               $DISTANCE as orderValue,
               m.located_at as locatedAt,
               $DISTANCE as distance
        from member m
        where $VISIBLE
          and m.latitude is not null
          and m.longitude is not null
          and (
            cast(:cursorValue as double precision) is null
            or $DISTANCE > cast(:cursorValue as double precision)
            or ($DISTANCE = cast(:cursorValue as double precision) and m.id > cast(:cursorId as bigint))
          )
        order by orderValue asc, m.id asc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findByDistance(
        @Param("memberId") memberId: Long,
        @Param("gender") gender: String?,
        @Param("latitude") latitude: Double,
        @Param("longitude") longitude: Double,
        @Param("cursorValue") cursorValue: Double?,
        @Param("cursorId") cursorId: Long?,
        @Param("size") size: Int,
    ): List<MemberListRow>

    companion object {

        private const val VISIBLE = """
            m.deleted_at is null
              and m.id <> :memberId
              and (cast(:gender as varchar) is null or m.gender = cast(:gender as varchar))
              and not exists (
                select 1 from member_block b
                where (b.blocker_id = :memberId and b.blocked_member_id = m.id)
                   or (b.blocker_id = m.id and b.blocked_member_id = :memberId)
              )
        """

        private const val DISTANCE = """
            st_distancesphere(
              st_makepoint(m.longitude, m.latitude),
              st_makepoint(cast(:longitude as double precision), cast(:latitude as double precision))
            )
        """
    }
}
