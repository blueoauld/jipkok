package com.blueoauld.server.domain.point.dto.response

import com.blueoauld.server.domain.point.entity.PointHistory
import com.blueoauld.server.domain.point.entity.type.PointType
import java.time.Instant

data class PointHistoryResponse(

    val historyId: Long,
    val type: PointType,
    val amount: Int,
    val balanceAfter: Int,
    val recordedAt: Instant,
) {

    companion object {

        fun from(pointHistory: PointHistory) = PointHistoryResponse(
            historyId = pointHistory.id,
            type = pointHistory.type,
            amount = pointHistory.amount,
            balanceAfter = pointHistory.balanceAfter,
            recordedAt = pointHistory.recordedAt,
        )
    }
}
