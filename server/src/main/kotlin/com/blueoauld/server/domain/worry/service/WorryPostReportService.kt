package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.entity.WorryPostReport
import com.blueoauld.server.domain.worry.event.WorryPostReportedEvent
import com.blueoauld.server.domain.worry.repository.WorryPostReportRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorryPostReportService(

    private val worryPostReportRepository: WorryPostReportRepository,
    private val worryPostRepository: WorryPostRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional
    fun report(reporterId: Long, postId: Long) {
        val post = worryPostRepository.findById(postId).orElseThrow {
            BusinessException(ErrorCode.WORRY_POST_NOT_FOUND)
        }

        if (post.memberId == reporterId) {
            throw BusinessException(ErrorCode.SELF_REPORT)
        }

        if (worryPostReportRepository.existsByReporterIdAndPostId(reporterId, postId)) {
            throw BusinessException(ErrorCode.DUPLICATE_WORRY_POST_REPORT)
        }

        worryPostReportRepository.saveAndFlush(WorryPostReport(reporterId, postId))

        val reportCount = worryPostReportRepository.countByPostId(postId)

        if (reportCount == NOTIFY_REPORT_COUNT.toLong()) {
            eventPublisher.publishEvent(
                WorryPostReportedEvent(
                    postId = post.id,
                    memberId = post.memberId,
                    content = post.content,
                    createdAt = post.createdAt,
                    reportCount = reportCount,
                ),
            )
        }
    }

    companion object {

        const val NOTIFY_REPORT_COUNT = 5
    }
}
