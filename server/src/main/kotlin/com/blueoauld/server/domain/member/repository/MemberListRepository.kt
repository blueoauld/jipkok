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
               $DISTANCE as distance,
               $FAVORITED as favoritedByMe
        from member m
        where $VISIBLE $GENDER $AGE
          and m.located_at is not null
          and (
            cast(:cursorValue as double precision) is null
            or m.located_at < to_timestamp(cast(:cursorValue as double precision))
            or (
              m.located_at = to_timestamp(cast(:cursorValue as double precision))
              and m.id < cast(:cursorId as bigint)
            )
          )
        order by m.located_at desc, m.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findRecent(
        @Param("memberId") memberId: Long,
        @Param("gender") gender: String?,
        @Param("minBirthYear") minBirthYear: Int?,
        @Param("maxBirthYear") maxBirthYear: Int?,
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
               $DISTANCE as distance,
               $FAVORITED as favoritedByMe
        from member m
        where $VISIBLE $GENDER $AGE
          and m.latitude is not null
          and m.longitude is not null
          and (
            cast(:cursorValue as double precision) is null
            or $DISTANCE > cast(:cursorValue as double precision)
            or ($DISTANCE = cast(:cursorValue as double precision) and m.id > cast(:cursorId as bigint))
          )
        order by $DISTANCE_ORDER asc, m.id asc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findByDistance(
        @Param("memberId") memberId: Long,
        @Param("gender") gender: String?,
        @Param("minBirthYear") minBirthYear: Int?,
        @Param("maxBirthYear") maxBirthYear: Int?,
        @Param("latitude") latitude: Double,
        @Param("longitude") longitude: Double,
        @Param("cursorValue") cursorValue: Double?,
        @Param("cursorId") cursorId: Long?,
        @Param("size") size: Int,
    ): List<MemberListRow>

    @Query(
        value = """
        select m.id as memberId,
               cast(m.received_like_count as double precision) as orderValue,
               m.located_at as locatedAt,
               cast(null as double precision) as distance,
               $FAVORITED as favoritedByMe
        from member m
        where $VISIBLE $GENDER
          and (
            cast(:cursorLikeCount as bigint) is null
            or (m.received_like_count, $LOCATED_EPOCH, m.id) < (
              cast(:cursorLikeCount as bigint),
              cast(:cursorLocatedAt as bigint),
              cast(:cursorId as bigint)
            )
          )
        order by m.received_like_count desc, $LOCATED_EPOCH desc, m.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findByReceivedLikeCount(
        @Param("memberId") memberId: Long,
        @Param("gender") gender: String?,
        @Param("cursorLikeCount") cursorLikeCount: Long?,
        @Param("cursorLocatedAt") cursorLocatedAt: Long?,
        @Param("cursorId") cursorId: Long?,
        @Param("size") size: Int,
    ): List<MemberListRow>

    @Query(
        value = """
        select m.id as memberId,
               coalesce(extract(epoch from m.located_at), 0) as orderValue,
               m.located_at as locatedAt,
               cast(null as double precision) as distance,
               $FAVORITED as favoritedByMe
        from member m
        where $VISIBLE
          and lower(m.nickname) like lower(:keyword) || '%' escape '\'
          and (
            cast(:cursorValue as double precision) is null
            or coalesce(extract(epoch from m.located_at), 0) < cast(:cursorValue as double precision)
            or (
              coalesce(extract(epoch from m.located_at), 0) = cast(:cursorValue as double precision)
              and m.id < cast(:cursorId as bigint)
            )
          )
        order by orderValue desc, m.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findByNicknamePrefix(
        @Param("memberId") memberId: Long,
        @Param("keyword") keyword: String,
        @Param("cursorValue") cursorValue: Double?,
        @Param("cursorId") cursorId: Long?,
        @Param("size") size: Int,
    ): List<MemberListRow>

    companion object {

        private const val VISIBLE = """
            m.deleted_at is null
              and m.id <> :memberId
              and not exists (
                select 1 from member_block b
                where (b.blocker_id = :memberId and b.blocked_member_id = m.id)
                   or (b.blocker_id = m.id and b.blocked_member_id = :memberId)
              )
        """

        private const val FAVORITED = """
            exists (
              select 1 from member_favorite f
              where f.member_id = :memberId and f.favorite_member_id = m.id
            )
        """

        private const val LOCATED_EPOCH = """
            coalesce(cast(extract(epoch from m.located_at) as bigint), 0)
        """

        private const val GENDER = """
            and (cast(:gender as varchar) is null or m.gender = cast(:gender as varchar))
        """

        private const val AGE = """
            and (cast(:minBirthYear as integer) is null or m.birth_year >= cast(:minBirthYear as integer))
            and (cast(:maxBirthYear as integer) is null or m.birth_year <= cast(:maxBirthYear as integer))
        """

        private const val DISTANCE = """
            st_distancesphere(
              st_makepoint(m.longitude, m.latitude),
              st_makepoint(cast(:longitude as double precision), cast(:latitude as double precision))
            )
        """

        private const val DISTANCE_ORDER = """
            geography(st_makepoint(m.longitude, m.latitude))
              <-> geography(st_makepoint(cast(:longitude as double precision), cast(:latitude as double precision)))
        """
    }
}
