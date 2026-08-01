package com.blueoauld.server.domain.block.repository

import com.blueoauld.server.domain.block.entity.MemberBlock
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository

interface MemberBlockRepository : JpaRepository<MemberBlock, Long> {

    fun existsByBlockerIdAndBlockedMemberId(blockerId: Long, blockedMemberId: Long): Boolean

    fun deleteByBlockerIdAndBlockedMemberId(blockerId: Long, blockedMemberId: Long): Long

    fun findByBlockerIdAndIdLessThanOrderByIdDesc(blockerId: Long, id: Long, limit: Limit): List<MemberBlock>
}
