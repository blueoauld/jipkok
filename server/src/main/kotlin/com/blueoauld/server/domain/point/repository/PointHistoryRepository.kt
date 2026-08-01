package com.blueoauld.server.domain.point.repository

import com.blueoauld.server.domain.point.entity.PointHistory
import com.blueoauld.server.domain.point.entity.type.PointType
import org.springframework.data.domain.Limit
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface PointHistoryRepository : JpaRepository<PointHistory, Long> {

    fun countByMemberIdAndTypeAndRecordedAtGreaterThanEqual(
        memberId: Long,
        type: PointType,
        recordedAt: Instant,
    ): Long

    fun findByMemberIdAndIdLessThanOrderByIdDesc(memberId: Long, id: Long, limit: Limit): List<PointHistory>
}
