package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.repository.FeedPostLikeRepository
import com.blueoauld.server.domain.feed.repository.FeedPostReportRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.time.KOREA_ID
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class FeedPostCleaner(

    private val feedPostRepository: FeedPostRepository,
    private val feedPostLikeRepository: FeedPostLikeRepository,
    private val feedPostReportRepository: FeedPostReportRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUpDeletedPosts() {
        val postIds = feedPostRepository.findIdsDeletedBefore(clock.instant().minus(RETENTION))

        if (postIds.isEmpty()) {
            return
        }

        val objectKeys = feedPostRepository.findObjectKeysByIdIn(postIds)

        feedPostLikeRepository.deleteAllByPostIdIn(postIds)
        feedPostReportRepository.deleteAllByPostIdIn(postIds)
        feedPostRepository.deleteAllByIdIn(postIds)

        if (objectKeys.isNotEmpty()) {
            eventPublisher.publishEvent(PhotosDeletedEvent(objectKeys))
        }

        log.info { "삭제된 피드 ${postIds.size}건을 정리했다." }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)

        private const val CLEAN_UP_CRON = "0 35 4 * * *"
    }
}
