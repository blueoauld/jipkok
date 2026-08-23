package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.translation.entity.type.TranslationSource
import com.blueoauld.server.domain.translation.repository.TranslationRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentReportRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostReportRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant

private val log = KotlinLogging.logger {}

@Component
class WorryCleaner(

    private val worryPostRepository: WorryPostRepository,
    private val worryPostLikeRepository: WorryPostLikeRepository,
    private val worryPostReportRepository: WorryPostReportRepository,
    private val worryCommentRepository: WorryCommentRepository,
    private val worryCommentReportRepository: WorryCommentReportRepository,
    private val translationRepository: TranslationRepository,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA)
    @Transactional
    fun cleanUp() {
        val threshold = clock.instant().minus(RETENTION)

        cleanUpDeletedPosts(threshold)
        cleanUpDeletedComments(threshold)
    }

    private fun cleanUpDeletedPosts(threshold: Instant) {
        val postIds = worryPostRepository.findIdsDeletedBefore(threshold)

        if (postIds.isEmpty()) {
            return
        }

        val commentIds = worryCommentRepository.findIdsByPostIdIn(postIds)

        if (commentIds.isNotEmpty()) {
            worryCommentReportRepository.deleteAllByCommentIdIn(commentIds)
            translationRepository.deleteAllBySourceTypeAndSourceIdIn(TranslationSource.WORRY_COMMENT, commentIds)
            worryCommentRepository.deleteAllByIdIn(commentIds)
        }

        translationRepository.deleteAllBySourceTypeAndSourceIdIn(TranslationSource.WORRY_POST, postIds)
        worryPostLikeRepository.deleteAllByPostIdIn(postIds)
        worryPostReportRepository.deleteAllByPostIdIn(postIds)
        worryPostRepository.deleteAllByIdIn(postIds)

        log.info { "삭제된 고민 ${postIds.size}건을 정리했다." }
    }

    private fun cleanUpDeletedComments(threshold: Instant) {
        val commentIds = worryCommentRepository.findIdsDeletedBeforeWithoutReplies(threshold)

        if (commentIds.isEmpty()) {
            return
        }

        worryCommentReportRepository.deleteAllByCommentIdIn(commentIds)
        translationRepository.deleteAllBySourceTypeAndSourceIdIn(TranslationSource.WORRY_COMMENT, commentIds)
        worryCommentRepository.deleteAllByIdIn(commentIds)

        log.info { "삭제된 고민 댓글 ${commentIds.size}건을 정리했다." }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)

        private const val CLEAN_UP_CRON = "0 45 4 * * *"
        private const val KOREA = "Asia/Seoul"
    }
}
