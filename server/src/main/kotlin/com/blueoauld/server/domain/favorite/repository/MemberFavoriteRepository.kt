package com.blueoauld.server.domain.favorite.repository

import com.blueoauld.server.domain.favorite.entity.MemberFavorite
import org.springframework.data.domain.Limit
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

    fun findByMemberIdAndIdLessThanOrderByIdDesc(memberId: Long, id: Long, limit: Limit): List<MemberFavorite>

    fun findByFavoriteMemberIdAndIdLessThanOrderByIdDesc(
        favoriteMemberId: Long,
        id: Long,
        limit: Limit,
    ): List<MemberFavorite>
}
