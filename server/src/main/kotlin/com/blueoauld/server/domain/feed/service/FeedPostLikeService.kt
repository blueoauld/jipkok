package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.entity.FeedPostLike
import com.blueoauld.server.domain.feed.repository.FeedPostLikeRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class FeedPostLikeService(

    private val feedPostLikeRepository: FeedPostLikeRepository,
    private val feedPostRepository: FeedPostRepository,
) {

    @Transactional
    fun like(memberId: Long, postId: Long) {
        if (!feedPostRepository.existsById(postId)) {
            throw BusinessException(ErrorCode.FEED_POST_NOT_FOUND)
        }

        if (feedPostLikeRepository.existsByPostIdAndMemberId(postId, memberId)) {
            return
        }

        runCatching { feedPostLikeRepository.saveAndFlush(FeedPostLike(postId, memberId)) }
            .onSuccess { feedPostRepository.increaseLikeCount(postId) }
            .onFailure { if (it !is DataIntegrityViolationException) throw it }
    }

    @Transactional
    fun cancel(memberId: Long, postId: Long) {
        if (feedPostLikeRepository.deleteByPostIdAndMemberId(postId, memberId) > 0) {
            feedPostRepository.decreaseLikeCount(postId)
        }
    }
}
