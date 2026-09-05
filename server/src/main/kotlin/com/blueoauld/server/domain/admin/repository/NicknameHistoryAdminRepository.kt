package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.member.entity.NicknameHistory
import org.springframework.data.jpa.repository.JpaRepository

interface NicknameHistoryAdminRepository : JpaRepository<NicknameHistory, Long> {

    fun findAllByMemberIdOrderByIdDesc(memberId: Long): List<NicknameHistory>
}
