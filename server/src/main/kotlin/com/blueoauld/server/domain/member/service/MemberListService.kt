package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.projection.MemberListRow
import com.blueoauld.server.domain.member.dto.response.MemberListItemResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberSort
import com.blueoauld.server.domain.member.repository.MemberListRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.response.ScrollResponse
import com.blueoauld.server.global.time.currentYear
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class MemberListService(

    private val memberListRepository: MemberListRepository,
    private val memberRepository: MemberRepository,
    private val memberSummaryService: MemberSummaryService,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findMembers(
        memberId: Long,
        sort: MemberSort,
        gender: Gender?,
        minAge: Int?,
        maxAge: Int?,
        cursor: String?,
        size: Int,
    ): ScrollResponse<MemberListItemResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val birthYears = toBirthYearRange(minAge, maxAge)
        val member = memberRepository.getMember(memberId)
        val rows = findRows(member, sort, gender, birthYears, MemberListCursor.decode(cursor), pageSize)
        val last = rows.lastOrNull().takeIf { rows.size == pageSize }

        return ScrollResponse(
            items = memberSummaryService.findListItems(memberId, rows),
            nextCursor = last?.let { MemberListCursor.encode(it.getOrderValue(), it.getMemberId()) },
        )
    }

    private fun toBirthYearRange(minAge: Int?, maxAge: Int?): BirthYearRange {
        val lower = minAge ?: Member.MIN_AGE
        val upper = maxAge ?: Member.MAX_AGE

        if (lower !in Member.MIN_AGE..Member.MAX_AGE ||
            upper !in Member.MIN_AGE..Member.MAX_AGE ||
            lower > upper
        ) {
            throw BusinessException(ErrorCode.INVALID_AGE_RANGE)
        }

        val currentYear = clock.currentYear()

        return BirthYearRange(
            min = maxAge?.let { currentYear - it },
            max = minAge?.let { currentYear - it },
        )
    }

    private fun findRows(
        member: Member,
        sort: MemberSort,
        gender: Gender?,
        birthYears: BirthYearRange,
        cursor: Pair<Double, Long>?,
        pageSize: Int,
    ): List<MemberListRow> {
        val latitude = member.latitude
        val longitude = member.longitude

        if (sort == MemberSort.DISTANCE && latitude != null && longitude != null) {
            return memberListRepository.findByDistance(
                memberId = member.id,
                gender = gender?.name,
                minBirthYear = birthYears.min,
                maxBirthYear = birthYears.max,
                latitude = latitude,
                longitude = longitude,
                cursorValue = cursor?.first,
                cursorId = cursor?.second,
                size = pageSize,
            )
        }

        return memberListRepository.findRecent(
            memberId = member.id,
            gender = gender?.name,
            minBirthYear = birthYears.min,
            maxBirthYear = birthYears.max,
            latitude = latitude,
            longitude = longitude,
            cursorValue = cursor?.first,
            cursorId = cursor?.second,
            size = pageSize,
        )
    }

    private data class BirthYearRange(

        val min: Int?,
        val max: Int?,
    )
}
