package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.response.MemberListItemResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberListRepository
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.response.ScrollResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class MemberRankingService(

    private val memberListRepository: MemberListRepository,
    private val memberSummaryService: MemberSummaryService,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findRanking(
        memberId: Long,
        gender: Gender?,
        minAge: Int?,
        maxAge: Int?,
        cursor: String?,
        size: Int,
    ): ScrollResponse<MemberListItemResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val birthYears = BirthYearRange.of(minAge, maxAge, clock)
        val decoded = MemberListCursor.decodeRanking(cursor)
        val rows = memberListRepository.findByReceivedLikeCount(
            memberId = memberId,
            gender = gender?.name,
            minBirthYear = birthYears.min,
            maxBirthYear = birthYears.max,
            cursorLikeCount = decoded?.first,
            cursorLocatedAt = decoded?.second,
            cursorId = decoded?.third,
            size = pageSize,
        )
        val last = rows.lastOrNull().takeIf { rows.size == pageSize }

        return ScrollResponse(
            items = memberSummaryService.findListItems(memberId, rows),
            nextCursor = last?.let {
                MemberListCursor.encodeRanking(
                    likeCount = it.getOrderValue().toLong(),
                    locatedAt = it.getLocatedAt()?.epochSecond ?: 0,
                    memberId = it.getMemberId(),
                )
            },
        )
    }
}
