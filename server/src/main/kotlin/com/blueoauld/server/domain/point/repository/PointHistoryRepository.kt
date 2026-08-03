package com.blueoauld.server.domain.point.repository

import com.blueoauld.server.domain.point.entity.PointHistory
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository

interface PointHistoryRepository : JpaRepository<PointHistory, Long> {

    fun findByMemberIdAndIdLessThanOrderByIdDesc(memberId: Long, id: Long, limit: Limit): List<PointHistory>

    fun deleteAllByMemberId(memberId: Long)
}
