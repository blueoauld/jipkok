package com.blueoauld.server.domain.favorite.service

import com.blueoauld.server.domain.favorite.entity.MemberFavorite
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberFavoriteService(

    private val memberFavoriteRepository: MemberFavoriteRepository,
    private val memberRepository: MemberRepository,
    private val memberSummaryService: MemberSummaryService,
) {

    @Transactional
    fun add(memberId: Long, favoriteMemberId: Long) {
        if (memberId == favoriteMemberId) {
            throw BusinessException(ErrorCode.SELF_FAVORITE)
        }

        if (!memberRepository.existsById(favoriteMemberId)) {
            throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (memberFavoriteRepository.existsByMemberIdAndFavoriteMemberId(memberId, favoriteMemberId)) {
            return
        }

        memberFavoriteRepository.saveAndFlush(MemberFavorite(memberId, favoriteMemberId))
    }

    @Transactional
    fun remove(memberId: Long, favoriteMemberId: Long) {
        memberFavoriteRepository.deleteByMemberIdAndFavoriteMemberId(memberId, favoriteMemberId)
    }

    @Transactional(readOnly = true)
    fun findFavorites(memberId: Long, cursor: Long?, size: Int): CursorResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val favorites = memberFavoriteRepository.findByMemberIdAndIdLessThanOrderByIdDesc(
            memberId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return toResponse(favorites, pageSize) { it.favoriteMemberId }
    }

    @Transactional(readOnly = true)
    fun findReceived(favoriteMemberId: Long, cursor: Long?, size: Int): CursorResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val favorites = memberFavoriteRepository.findByFavoriteMemberIdAndIdLessThanOrderByIdDesc(
            favoriteMemberId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return toResponse(favorites, pageSize) { it.memberId }
    }

    private fun toResponse(
        favorites: List<MemberFavorite>,
        pageSize: Int,
        toMemberId: (MemberFavorite) -> Long,
    ) = CursorResponse(
        items = memberSummaryService.findSummaries(favorites.map(toMemberId)),
        nextCursor = favorites.lastOrNull()?.id.takeIf { favorites.size == pageSize },
    )
}
