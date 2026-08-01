package com.blueoauld.server.domain.like.service

import com.blueoauld.server.domain.like.entity.MemberLike
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberLikeService(

    private val memberLikeRepository: MemberLikeRepository,
    private val memberRepository: MemberRepository,
    private val memberSummaryService: MemberSummaryService,
) {

    @Transactional
    fun like(likerId: Long, likedMemberId: Long) {
        if (likerId == likedMemberId) {
            throw BusinessException(ErrorCode.SELF_LIKE)
        }

        if (!memberRepository.existsById(likedMemberId)) {
            throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (memberLikeRepository.existsByLikerIdAndLikedMemberId(likerId, likedMemberId)) {
            return
        }

        runCatching { memberLikeRepository.saveAndFlush(MemberLike(likerId, likedMemberId)) }
            .onSuccess { memberRepository.increaseReceivedLikeCount(likedMemberId) }
            .onFailure { if (it !is DataIntegrityViolationException) throw it }
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
        val likes = memberLikeRepository.findByLikerIdAndIdLessThanOrderByIdDesc(
            likerId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return toResponse(likes, pageSize) { it.likedMemberId }
    }

    @Transactional(readOnly = true)
    fun findReceived(likedMemberId: Long, cursor: Long?, size: Int): CursorResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val likes = memberLikeRepository.findByLikedMemberIdAndIdLessThanOrderByIdDesc(
            likedMemberId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return toResponse(likes, pageSize) { it.likerId }
    }

    private fun toResponse(likes: List<MemberLike>, pageSize: Int, toMemberId: (MemberLike) -> Long) =
        CursorResponse(
            items = memberSummaryService.findSummaries(likes.map(toMemberId)),
            nextCursor = likes.lastOrNull()?.id.takeIf { likes.size == pageSize },
        )
}
