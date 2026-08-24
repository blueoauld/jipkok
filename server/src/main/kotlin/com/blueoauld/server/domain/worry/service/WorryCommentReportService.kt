package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.entity.WorryCommentReport
import com.blueoauld.server.domain.worry.event.WorryCommentAutoDeletedEvent
import com.blueoauld.server.domain.worry.repository.WorryCommentReportRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorryCommentReportService(

    private val worryCommentReportRepository: WorryCommentReportRepository,
    private val worryCommentRepository: WorryCommentRepository,
    private val worryPostRepository: WorryPostRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional
    fun report(reporterId: Long, commentId: Long) {
        val comment = worryCommentRepository.findLockedById(commentId)
            ?: throw BusinessException(ErrorCode.WORRY_COMMENT_NOT_FOUND)

        if (comment.memberId == reporterId) {
            throw BusinessException(ErrorCode.SELF_REPORT)
        }

        if (worryCommentReportRepository.existsByReporterIdAndCommentId(reporterId, commentId)) {
            throw BusinessException(ErrorCode.DUPLICATE_WORRY_COMMENT_REPORT)
        }

        worryCommentReportRepository.saveAndFlush(WorryCommentReport(reporterId, commentId))

        val reportCount = worryCommentReportRepository.countByCommentId(commentId)

        if (reportCount >= AUTO_DELETE_REPORT_COUNT) {
            comment.deletedByReport = true
            worryCommentRepository.saveAndFlush(comment)
            worryCommentRepository.delete(comment)
            worryPostRepository.decreaseCommentCount(comment.postId)
            eventPublisher.publishEvent(
                WorryCommentAutoDeletedEvent(
                    commentId = comment.id,
                    postId = comment.postId,
                    memberId = comment.memberId,
                    content = comment.content,
                    createdAt = comment.createdAt,
                    reportCount = reportCount,
                ),
            )
        }
    }

    companion object {

        const val AUTO_DELETE_REPORT_COUNT = 5
    }
}
