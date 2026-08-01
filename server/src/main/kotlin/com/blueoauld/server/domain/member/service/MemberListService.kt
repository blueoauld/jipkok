package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.projection.MemberListRow
import com.blueoauld.server.domain.member.dto.response.MemberListItemResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberSort
import com.blueoauld.server.domain.member.repository.MemberListRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.response.ScrollResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberListService(

    private val memberListRepository: MemberListRepository,
    private val memberRepository: MemberRepository,
    private val memberSummaryService: MemberSummaryService,
) {

    @Transactional(readOnly = true)
    fun findMembers(
        memberId: Long,
        sort: MemberSort,
        gender: Gender?,
        cursor: String?,
        size: Int,
    ): ScrollResponse<MemberListItemResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val member = findMember(memberId)
        val rows = findRows(member, sort, gender, ScrollResponse.decode(cursor), pageSize)
        val last = rows.lastOrNull().takeIf { rows.size == pageSize }

        return ScrollResponse(
            items = toItems(rows),
            nextCursor = last?.let { ScrollResponse.encode(it.getOrderValue(), it.getMemberId()) },
        )
    }

    private fun findRows(
        member: Member,
        sort: MemberSort,
        gender: Gender?,
        cursor: Pair<Double, Long>?,
        pageSize: Int,
    ): List<MemberListRow> = when (sort) {
        MemberSort.RECENT -> memberListRepository.findRecent(
            memberId = member.id,
            gender = gender?.name,
            latitude = member.latitude,
            longitude = member.longitude,
            cursorValue = cursor?.first,
            cursorId = cursor?.second,
            size = pageSize,
        )

        MemberSort.DISTANCE -> memberListRepository.findByDistance(
            memberId = member.id,
            gender = gender?.name,
            latitude = member.latitude ?: throw BusinessException(ErrorCode.LOCATION_REQUIRED),
            longitude = member.longitude ?: throw BusinessException(ErrorCode.LOCATION_REQUIRED),
            cursorValue = cursor?.first,
            cursorId = cursor?.second,
            size = pageSize,
        )
    }

    private fun toItems(rows: List<MemberListRow>): List<MemberListItemResponse> {
        val summaries = memberSummaryService.findSummaries(rows.map { it.getMemberId() })
            .associateBy { it.memberId }

        return rows.mapNotNull { row ->
            summaries[row.getMemberId()]?.let {
                MemberListItemResponse.of(it, row.getLocatedAt(), row.getDistance())
            }
        }
    }

    private fun findMember(memberId: Long): Member = memberRepository.findById(memberId).orElseThrow {
        BusinessException(ErrorCode.MEMBER_NOT_FOUND)
    }
}
