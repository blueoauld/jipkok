package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.repository.FeedPostLikeRepository
import com.blueoauld.server.domain.feed.repository.FeedPostReportRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class FeedPostCleanerTest {

    private val feedPostRepository = mockk<FeedPostRepository>(relaxed = true)

    private val feedPostLikeRepository = mockk<FeedPostLikeRepository>(relaxed = true)

    private val feedPostReportRepository = mockk<FeedPostReportRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val cleaner = FeedPostCleaner(
        feedPostRepository,
        feedPostLikeRepository,
        feedPostReportRepository,
        photoStorage,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { feedPostRepository.findIdsDeletedBefore(any()) } returns POST_IDS
        every { feedPostRepository.findObjectKeysByIdIn(POST_IDS) } returns OBJECT_KEYS
    }

    @Test
    fun `보관 기간이 지난 글은 좋아요, 신고, 사진까지 지운다`() {
        // when
        cleaner.cleanUpDeletedPosts()

        // then
        verify { feedPostRepository.findIdsDeletedBefore(NOW.minus(FeedPostCleaner.RETENTION)) }
        verifyOrder {
            feedPostLikeRepository.deleteAllByPostIdIn(POST_IDS)
            feedPostReportRepository.deleteAllByPostIdIn(POST_IDS)
            feedPostRepository.deleteAllByIdIn(POST_IDS)
            photoStorage.delete(OBJECT_KEYS)
        }
    }

    @Test
    fun `사진이 없으면 저장소를 건드리지 않는다`() {
        // given
        every { feedPostRepository.findObjectKeysByIdIn(POST_IDS) } returns emptyList()

        // when
        cleaner.cleanUpDeletedPosts()

        // then
        verify(exactly = 0) { photoStorage.delete(any()) }
    }

    @Test
    fun `지울 글이 없으면 아무것도 하지 않는다`() {
        // given
        every { feedPostRepository.findIdsDeletedBefore(any()) } returns emptyList()

        // when
        cleaner.cleanUpDeletedPosts()

        // then
        verify(exactly = 0) { feedPostRepository.deleteAllByIdIn(any()) }
        verify(exactly = 0) { photoStorage.delete(any()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")

        private val POST_IDS = listOf(10L, 11L)
        private val OBJECT_KEYS = listOf("feeds/1/a.jpg", "feeds/2/b.jpg")
    }
}
