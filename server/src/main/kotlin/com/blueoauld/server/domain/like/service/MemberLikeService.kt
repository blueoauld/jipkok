package com.blueoauld.server.domain.like.service

import com.blueoauld.server.domain.like.entity.MemberLike
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberLikeService(

    private val memberLikeRepository: MemberLikeRepository,
    private val memberRepository: MemberRepository,
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
}
