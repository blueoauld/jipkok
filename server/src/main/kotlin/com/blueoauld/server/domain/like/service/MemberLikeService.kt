package com.blueoauld.server.domain.like.service

import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.like.entity.MemberLike
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.checkMember
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberLikeService(

    private val memberLikeRepository: MemberLikeRepository,
    private val memberRepository: MemberRepository,
    private val contactBlockRepository: ContactBlockRepository,
    private val memberSummaryService: MemberSummaryService,
) {

    @Transactional
    fun like(likerId: Long, likedMemberId: Long) {
        if (likerId == likedMemberId) {
            throw BusinessException(ErrorCode.SELF_LIKE)
        }

        memberRepository.checkMember(likedMemberId)

        if (contactBlockRepository.existsBetween(likerId, likedMemberId)) {
            throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (memberLikeRepository.existsByLikerIdAndLikedMemberId(likerId, likedMemberId)) {
            return
        }

        memberLikeRepository.saveAndFlush(MemberLike(likerId, likedMemberId))
        memberRepository.increaseReceivedLikeCount(likedMemberId)
    }

    @Transactional
    fun cancel(likerId: Long, likedMemberId: Long) {
        if (memberLikeRepository.deleteByLikerIdAndLikedMemberId(likerId, likedMemberId) > 0) {
            memberRepository.decreaseReceivedLikeCount(likedMemberId)
        }
    }

    @Transactional(readOnly = true)
    fun findLiked(likerId: Long, cursor: Long?, size: Int): CursorResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val likes = memberLikeRepository.findVisibleByLikerId(likerId, cursor ?: Long.MAX_VALUE, pageSize)

        return toResponse(likerId, likes, pageSize) { it.likedMemberId }
    }

    @Transactional(readOnly = true)
    fun findReceived(likedMemberId: Long, cursor: Long?, size: Int): CursorResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val likes = memberLikeRepository.findVisibleByLikedMemberId(likedMemberId, cursor ?: Long.MAX_VALUE, pageSize)

        return toResponse(likedMemberId, likes, pageSize) { it.likerId }
    }

    private fun toResponse(
        requesterId: Long,
        likes: List<MemberLike>,
        pageSize: Int,
        toMemberId: (MemberLike) -> Long,
    ) = CursorResponse(
        items = memberSummaryService.findSummaries(requesterId, likes.map(toMemberId)),
        nextCursor = likes.lastOrNull()?.id.takeIf { likes.size == pageSize },
    )
}
