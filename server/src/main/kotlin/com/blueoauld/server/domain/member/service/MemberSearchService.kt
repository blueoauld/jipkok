package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.repository.MemberListRepository
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.response.ScrollResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberSearchService(

    private val memberListRepository: MemberListRepository,
    private val memberSummaryService: MemberSummaryService,
) {

    @Transactional(readOnly = true)
    fun searchByNickname(
        memberId: Long,
        keyword: String,
        cursor: String?,
        size: Int,
    ): ScrollResponse<MemberSummaryResponse> {
        val trimmed = keyword.trim()

        if (trimmed.length < MIN_KEYWORD_LENGTH) {
            return ScrollResponse(items = emptyList(), nextCursor = null)
        }

        val pageSize = CursorResponse.pageSize(size)
        val decoded = ScrollResponse.decode(cursor)
        val rows = memberListRepository.findByNicknamePrefix(
            memberId = memberId,
            keyword = escapeLike(trimmed),
            cursorValue = decoded?.first,
            cursorId = decoded?.second,
            size = pageSize,
        )
        val last = rows.lastOrNull().takeIf { rows.size == pageSize }

        return ScrollResponse(
            items = memberSummaryService.findSummaries(rows.map { it.getMemberId() }),
            nextCursor = last?.let { ScrollResponse.encode(it.getOrderValue(), it.getMemberId()) },
        )
    }

    private fun escapeLike(keyword: String) = keyword
        .replace("""\""", """\\""")
        .replace("%", """\%""")
        .replace("_", """\_""")

    companion object {

        const val MIN_KEYWORD_LENGTH = 2
    }
}
