package com.blueoauld.server.domain.point.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.dto.response.PointHistoryResponse
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.domain.point.entity.PointHistory
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.repository.PointHistoryRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

@Service
class PointService(

    private val pointHistoryRepository: PointHistoryRepository,
    private val memberRepository: MemberRepository,
    private val clock: Clock,
) {

    @Transactional
    fun earn(memberId: Long, type: PointType): PointRewardResponse {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (reachedDailyLimit(memberId, type)) {
            return PointRewardResponse(earned = false, amount = 0, balance = member.pointBalance)
        }

        val balance = member.pointBalance + type.amount
        memberRepository.addPointBalance(memberId, type.amount)
        pointHistoryRepository.save(PointHistory(memberId, type, type.amount, balance, clock.instant()))

        return PointRewardResponse(earned = true, amount = type.amount, balance = balance)
    }

    @Transactional
    fun spend(memberId: Long, type: PointType) {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (memberRepository.addPointBalance(memberId, type.amount) == 0) {
            throw BusinessException(ErrorCode.NOT_ENOUGH_POINT)
        }

        val balance = member.pointBalance + type.amount
        pointHistoryRepository.save(PointHistory(memberId, type, type.amount, balance, clock.instant()))
    }

    @Transactional(readOnly = true)
    fun findBalance(memberId: Long) = memberRepository.findById(memberId)
        .orElseThrow { BusinessException(ErrorCode.MEMBER_NOT_FOUND) }
        .pointBalance

    @Transactional(readOnly = true)
    fun findHistories(memberId: Long, cursor: Long?, size: Int): CursorResponse<PointHistoryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val histories = pointHistoryRepository.findByMemberIdAndIdLessThanOrderByIdDesc(
            memberId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return CursorResponse(
            items = histories.map(PointHistoryResponse::from),
            nextCursor = histories.lastOrNull()?.id.takeIf { histories.size == pageSize },
        )
    }

    private fun reachedDailyLimit(memberId: Long, type: PointType): Boolean {
        val dailyLimit = type.dailyLimit ?: return false
        val earnedToday = pointHistoryRepository.countByMemberIdAndTypeAndRecordedAtGreaterThanEqual(
            memberId,
            type,
            startOfToday(),
        )

        return earnedToday >= dailyLimit
    }

    private fun startOfToday() = LocalDate.now(clock.withZone(KOREA)).atStartOfDay(KOREA).toInstant()

    companion object {

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
