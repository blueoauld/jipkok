package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.repository.WorryCommentReportRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostReportRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class WorryCleanerTest {

    private val worryPostRepository = mockk<WorryPostRepository>(relaxed = true)

    private val worryPostLikeRepository = mockk<WorryPostLikeRepository>(relaxed = true)

    private val worryPostReportRepository = mockk<WorryPostReportRepository>(relaxed = true)

    private val worryCommentRepository = mockk<WorryCommentRepository>(relaxed = true)

    private val worryCommentReportRepository = mockk<WorryCommentReportRepository>(relaxed = true)

    private val cleaner = WorryCleaner(
        worryPostRepository,
        worryPostLikeRepository,
        worryPostReportRepository,
        worryCommentRepository,
        worryCommentReportRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { worryPostRepository.findIdsDeletedBefore(any()) } returns POST_IDS
        every { worryCommentRepository.findIdsByPostIdIn(POST_IDS) } returns COMMENT_IDS
        every { worryCommentRepository.findIdsDeletedBefore(any()) } returns emptyList()
    }

    @Test
    fun `보관 기간이 지난 글은 댓글, 공감, 신고까지 지운다`() {
        // when
        cleaner.cleanUp()

        // then
        verify { worryPostRepository.findIdsDeletedBefore(NOW.minus(WorryCleaner.RETENTION)) }
        verifyOrder {
            worryCommentReportRepository.deleteAllByCommentIdIn(COMMENT_IDS)
            worryCommentRepository.deleteAllByIdIn(COMMENT_IDS)
            worryPostLikeRepository.deleteAllByPostIdIn(POST_IDS)
            worryPostReportRepository.deleteAllByPostIdIn(POST_IDS)
            worryPostRepository.deleteAllByIdIn(POST_IDS)
        }
    }

    @Test
    fun `글에 댓글이 없으면 댓글 삭제를 건너뛴다`() {
        // given
        every { worryCommentRepository.findIdsByPostIdIn(POST_IDS) } returns emptyList()

        // when
        cleaner.cleanUp()

        // then
        verify(exactly = 0) { worryCommentRepository.deleteAllByIdIn(any()) }
        verify { worryPostRepository.deleteAllByIdIn(POST_IDS) }
    }

    @Test
    fun `보관 기간이 지난 댓글은 남은 글에서도 신고와 함께 지운다`() {
        // given
        every { worryPostRepository.findIdsDeletedBefore(any()) } returns emptyList()
        every { worryCommentRepository.findIdsDeletedBefore(any()) } returns COMMENT_IDS

        // when
        cleaner.cleanUp()

        // then
        verify { worryCommentRepository.findIdsDeletedBefore(NOW.minus(WorryCleaner.RETENTION)) }
        verifyOrder {
            worryCommentReportRepository.deleteAllByCommentIdIn(COMMENT_IDS)
            worryCommentRepository.deleteAllByIdIn(COMMENT_IDS)
        }
    }

    @Test
    fun `지울 것이 없으면 아무것도 하지 않는다`() {
        // given
        every { worryPostRepository.findIdsDeletedBefore(any()) } returns emptyList()

        // when
        cleaner.cleanUp()

        // then
        verify(exactly = 0) { worryPostRepository.deleteAllByIdIn(any()) }
        verify(exactly = 0) { worryCommentRepository.deleteAllByIdIn(any()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")

        private val POST_IDS = listOf(10L, 11L)
        private val COMMENT_IDS = listOf(100L, 101L)
    }
}
