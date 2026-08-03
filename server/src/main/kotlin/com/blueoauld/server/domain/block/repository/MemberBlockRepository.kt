package com.blueoauld.server.domain.block.repository

import com.blueoauld.server.domain.block.entity.MemberBlock
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MemberBlockRepository : JpaRepository<MemberBlock, Long> {

    fun existsByBlockerIdAndBlockedMemberId(blockerId: Long, blockedMemberId: Long): Boolean

    fun deleteByBlockerIdAndBlockedMemberId(blockerId: Long, blockedMemberId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from MemberBlock b where b.blockerId = :memberId or b.blockedMemberId = :memberId")
    fun deleteAllByMember(@Param("memberId") memberId: Long)

    fun findByBlockerIdAndIdLessThanOrderByIdDesc(blockerId: Long, id: Long, limit: Limit): List<MemberBlock>
}
