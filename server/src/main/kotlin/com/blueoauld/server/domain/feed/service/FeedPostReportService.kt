package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.entity.FeedPostReport
import com.blueoauld.server.domain.feed.repository.FeedPostReportRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class FeedPostReportService(

    private val feedPostReportRepository: FeedPostReportRepository,
    private val feedPostRepository: FeedPostRepository,
) {

    @Transactional
    fun report(reporterId: Long, postId: Long) {
        val post = feedPostRepository.findById(postId).orElseThrow {
            BusinessException(ErrorCode.FEED_POST_NOT_FOUND)
        }

        if (post.memberId == reporterId) {
            throw BusinessException(ErrorCode.SELF_REPORT)
        }

        if (feedPostReportRepository.existsByReporterIdAndPostId(reporterId, postId)) {
            throw BusinessException(ErrorCode.DUPLICATE_FEED_POST_REPORT)
        }

        feedPostReportRepository.saveAndFlush(FeedPostReport(reporterId, postId))

        if (feedPostReportRepository.countByPostId(postId) >= AUTO_DELETE_REPORT_COUNT) {
            feedPostRepository.delete(post)
        }
    }

    companion object {

        const val AUTO_DELETE_REPORT_COUNT = 5
    }
}
