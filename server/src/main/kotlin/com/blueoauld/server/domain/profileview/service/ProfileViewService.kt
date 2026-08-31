package com.blueoauld.server.domain.profileview.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.domain.profileview.dto.response.ProfileViewResponse
import com.blueoauld.server.domain.profileview.entity.ProfileView
import com.blueoauld.server.domain.profileview.repository.ProfileViewRepository
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.response.ScrollResponse
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.temporal.ChronoUnit

@Service
class ProfileViewService(

    private val profileViewRepository: ProfileViewRepository,
    private val memberRepository: MemberRepository,
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

        profileViewRepository.saveAndFlush(ProfileView(viewerId, viewedMemberId, viewedAt))
    }

    @Transactional(readOnly = true)
    fun countNew(viewedMemberId: Long): Int {
        val seenAt = memberRepository.findById(viewedMemberId).orElse(null)?.profileViewsSeenAt
            ?: return profileViewRepository.countByViewedMemberId(viewedMemberId)

        return profileViewRepository.countByViewedMemberIdAndViewedAtAfter(viewedMemberId, seenAt)
    }

    @Transactional
    fun markSeen(viewedMemberId: Long) {
        memberRepository.findById(viewedMemberId).ifPresent {
            it.profileViewsSeenAt = clock.instant()
        }
    }

    @Transactional(readOnly = true)
    fun findViewers(viewedMemberId: Long, cursor: String?, size: Int): ScrollResponse<ProfileViewResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val decoded = ProfileViewCursor.decode(cursor)

        val views = if (decoded == null) {
            profileViewRepository.findByViewedMemberIdOrderByViewedAtDescIdDesc(viewedMemberId, Limit.of(pageSize))
        } else {
            profileViewRepository.findNextPage(viewedMemberId, decoded.first, decoded.second, Limit.of(pageSize))
        }

        val summaries = memberSummaryService.findSummaries(views.map { it.viewerId }).associateBy { it.memberId }
        val last = views.lastOrNull().takeIf { views.size == pageSize }

        return ScrollResponse(
            items = views.mapNotNull { view ->
                summaries[view.viewerId]?.let { ProfileViewResponse(it, view.viewedAt) }
            },
            nextCursor = last?.let { ProfileViewCursor.encode(it.viewedAt, it.id) },
        )
    }
}
