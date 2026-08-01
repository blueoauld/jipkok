package com.blueoauld.server.domain.favorite.repository

import com.blueoauld.server.domain.favorite.entity.MemberFavorite
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository

interface MemberFavoriteRepository : JpaRepository<MemberFavorite, Long> {

    fun existsByMemberIdAndFavoriteMemberId(memberId: Long, favoriteMemberId: Long): Boolean

    fun deleteByMemberIdAndFavoriteMemberId(memberId: Long, favoriteMemberId: Long): Long

    fun findByMemberIdAndIdLessThanOrderByIdDesc(memberId: Long, id: Long, limit: Limit): List<MemberFavorite>

    fun findByFavoriteMemberIdAndIdLessThanOrderByIdDesc(
        favoriteMemberId: Long,
        id: Long,
        limit: Limit,
    ): List<MemberFavorite>
}
