package com.blueoauld.server.domain.profileview.service

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.domain.profileview.entity.ProfileView
import com.blueoauld.server.domain.profileview.repository.ProfileViewRepository
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.response.ScrollResponse
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.temporal.ChronoUnit

@Service
class ProfileViewService(

    private val profileViewRepository: ProfileViewRepository,
    private val memberSummaryService: MemberSummaryService,
    private val clock: Clock,
) {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun record(viewerId: Long, viewedMemberId: Long) {
        if (viewerId == viewedMemberId) {
            return
        }

        val viewedAt = clock.instant().truncatedTo(ChronoUnit.MILLIS)
        val view = profileViewRepository.findByViewerIdAndViewedMemberId(viewerId, viewedMemberId)

        if (view != null) {
            view.viewedAt = viewedAt
            return
        }

        runCatching { profileViewRepository.saveAndFlush(ProfileView(viewerId, viewedMemberId, viewedAt)) }
            .onFailure { if (it !is DataIntegrityViolationException) throw it }
    }

    @Transactional(readOnly = true)
    fun findViewers(viewedMemberId: Long, cursor: String?, size: Int): ScrollResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val decoded = ScrollResponse.decodeProfileView(cursor)

        val views = if (decoded == null) {
            profileViewRepository.findByViewedMemberIdOrderByViewedAtDescIdDesc(viewedMemberId, Limit.of(pageSize))
        } else {
            profileViewRepository.findNextPage(viewedMemberId, decoded.first, decoded.second, Limit.of(pageSize))
        }

        val last = views.lastOrNull().takeIf { views.size == pageSize }

        return ScrollResponse(
            items = memberSummaryService.findSummaries(views.map { it.viewerId }),
            nextCursor = last?.let { ScrollResponse.encodeProfileView(it.viewedAt, it.id) },
        )
    }
}
