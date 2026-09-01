package com.blueoauld.server.domain.memo.repository

import com.blueoauld.server.domain.memo.entity.MemberMemo
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MemberMemoRepository : JpaRepository<MemberMemo, Long> {

    fun findByOwnerIdAndTargetId(ownerId: Long, targetId: Long): MemberMemo?

    fun findAllByOwnerIdAndTargetIdIn(ownerId: Long, targetIds: Collection<Long>): List<MemberMemo>

    fun deleteByOwnerIdAndTargetId(ownerId: Long, targetId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from MemberMemo m where m.ownerId = :memberId or m.targetId = :memberId")
    fun deleteAllByMember(@Param("memberId") memberId: Long)
}
