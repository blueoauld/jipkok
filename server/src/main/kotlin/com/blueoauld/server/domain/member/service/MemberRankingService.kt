package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberListRepository
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.response.ScrollResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberRankingService(

    private val memberListRepository: MemberListRepository,
    private val memberSummaryService: MemberSummaryService,
) {

    @Transactional(readOnly = true)
    fun findRanking(
        memberId: Long,
        gender: Gender?,
        cursor: String?,
        size: Int,
    ): ScrollResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val decoded = ScrollResponse.decodeRanking(cursor)
        val rows = memberListRepository.findByReceivedLikeCount(
            memberId = memberId,
            gender = gender?.name,
            cursorLikeCount = decoded?.first,
            cursorLocatedAt = decoded?.second,
            cursorId = decoded?.third,
            size = pageSize,
        )
        val last = rows.lastOrNull().takeIf { rows.size == pageSize }

        return ScrollResponse(
            items = memberSummaryService.findSummaries(rows.map { it.getMemberId() }),
            nextCursor = last?.let {
                ScrollResponse.encodeRanking(
                    likeCount = it.getOrderValue().toInt(),
                    locatedAt = it.getLocatedAt()?.epochSecond ?: 0,
                    memberId = it.getMemberId(),
                )
            },
        )
    }
}
