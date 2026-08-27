package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.entity.WorryPostLike
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorryPostLikeService(

    private val worryPostLikeRepository: WorryPostLikeRepository,
    private val worryPostRepository: WorryPostRepository,
) {

    @Transactional
    fun like(memberId: Long, postId: Long) {
        if (!worryPostRepository.existsById(postId)) {
            throw BusinessException(ErrorCode.WORRY_POST_NOT_FOUND)
        }

        if (worryPostLikeRepository.existsByPostIdAndMemberId(postId, memberId)) {
            return
        }

        worryPostLikeRepository.saveAndFlush(WorryPostLike(postId, memberId))
        worryPostRepository.increaseLikeCount(postId)
    }

    @Transactional
    fun cancel(memberId: Long, postId: Long) {
        if (worryPostLikeRepository.deleteByPostIdAndMemberId(postId, memberId) > 0) {
            worryPostRepository.decreaseLikeCount(postId)
        }
    }
}
