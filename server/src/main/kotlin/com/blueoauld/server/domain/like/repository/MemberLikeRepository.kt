package com.blueoauld.server.domain.like.repository

import com.blueoauld.server.domain.like.entity.MemberLike
import org.springframework.data.jpa.repository.JpaRepository

interface MemberLikeRepository : JpaRepository<MemberLike, Long> {

    fun existsByLikerIdAndLikedMemberId(likerId: Long, likedMemberId: Long): Boolean

    fun deleteByLikerIdAndLikedMemberId(likerId: Long, likedMemberId: Long): Long
}
