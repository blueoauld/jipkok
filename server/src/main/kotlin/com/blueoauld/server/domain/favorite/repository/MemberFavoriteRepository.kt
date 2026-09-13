package com.blueoauld.server.domain.favorite.repository

import com.blueoauld.server.domain.block.repository.ContactBlockRepository.Companion.NOT_CONTACT_BLOCKED
import com.blueoauld.server.domain.favorite.entity.MemberFavorite
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MemberFavoriteRepository : JpaRepository<MemberFavorite, Long> {

    fun existsByMemberIdAndFavoriteMemberId(memberId: Long, favoriteMemberId: Long): Boolean

    fun deleteByMemberIdAndFavoriteMemberId(memberId: Long, favoriteMemberId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from MemberFavorite f where f.memberId = :memberId or f.favoriteMemberId = :memberId")
    fun deleteAllByMember(@Param("memberId") memberId: Long)

    @Query(
        value = """
        select f.* from member_favorite f
        join member m on m.id = f.favorite_member_id
        where f.member_id = :memberId
          and f.id < :cursor
          and $NOT_CONTACT_BLOCKED
        order by f.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findVisibleByMemberId(
        @Param("memberId") memberId: Long,
        @Param("cursor") cursor: Long,
        @Param("size") size: Int,
    ): List<MemberFavorite>

    @Query(
        value = """
        select f.* from member_favorite f
        join member m on m.id = f.member_id
        where f.favorite_member_id = :memberId
          and f.id < :cursor
          and $NOT_CONTACT_BLOCKED
        order by f.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findVisibleByFavoriteMemberId(
        @Param("memberId") memberId: Long,
        @Param("cursor") cursor: Long,
        @Param("size") size: Int,
    ): List<MemberFavorite>
}
