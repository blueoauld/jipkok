package com.blueoauld.server.domain.like.repository

import com.blueoauld.server.domain.like.entity.MemberLike
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MemberLikeRepository : JpaRepository<MemberLike, Long> {

    fun existsByLikerIdAndLikedMemberId(likerId: Long, likedMemberId: Long): Boolean

    fun deleteByLikerIdAndLikedMemberId(likerId: Long, likedMemberId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from MemberLike l where l.likerId = :memberId or l.likedMemberId = :memberId")
    fun deleteAllByMember(@Param("memberId") memberId: Long)

    fun findByLikerIdAndIdLessThanOrderByIdDesc(likerId: Long, id: Long, limit: Limit): List<MemberLike>

    fun findByLikedMemberIdAndIdLessThanOrderByIdDesc(
        likedMemberId: Long,
        id: Long,
        limit: Limit,
    ): List<MemberLike>
}
