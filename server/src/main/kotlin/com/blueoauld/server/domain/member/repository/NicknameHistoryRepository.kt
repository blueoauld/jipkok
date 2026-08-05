package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.domain.member.entity.NicknameHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface NicknameHistoryRepository : JpaRepository<NicknameHistory, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from NicknameHistory h where h.memberId in :memberIds")
    fun deleteAllByMemberIdIn(@Param("memberIds") memberIds: List<Long>)
}
