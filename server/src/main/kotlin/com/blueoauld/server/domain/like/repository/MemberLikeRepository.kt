package com.blueoauld.server.domain.like.repository

import com.blueoauld.server.domain.block.repository.ContactBlockRepository.Companion.NOT_CONTACT_BLOCKED
import com.blueoauld.server.domain.like.entity.MemberLike
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

    @Query(
        value = """
        select l.* from member_like l
        join member m on m.id = l.liked_member_id
        where l.liker_id = :memberId
          and l.id < :cursor
          and $NOT_CONTACT_BLOCKED
        order by l.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findVisibleByLikerId(
        @Param("memberId") memberId: Long,
        @Param("cursor") cursor: Long,
        @Param("size") size: Int,
    ): List<MemberLike>

    @Query(
        value = """
        select l.* from member_like l
        join member m on m.id = l.liker_id
        where l.liked_member_id = :memberId
          and l.id < :cursor
          and $NOT_CONTACT_BLOCKED
        order by l.id desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun findVisibleByLikedMemberId(
        @Param("memberId") memberId: Long,
        @Param("cursor") cursor: Long,
        @Param("size") size: Int,
    ): List<MemberLike>
}
