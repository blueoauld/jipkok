package com.blueoauld.server.domain.feed.service

import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.entity.FeedPostReport
import com.blueoauld.server.domain.feed.repository.FeedPostReportRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

class FeedPostReportServiceTest {

    private val feedPostReportRepository = mockk<FeedPostReportRepository>(relaxed = true)

    private val feedPostRepository = mockk<FeedPostRepository>(relaxed = true)

    private val feedPostReportService = FeedPostReportService(feedPostReportRepository, feedPostRepository)

    @BeforeEach
    fun setUp() {
        every { feedPostRepository.findById(POST_ID) } returns Optional.of(post(AUTHOR_ID))
        every { feedPostReportRepository.existsByReporterIdAndPostId(any(), any()) } returns false
        every { feedPostReportRepository.saveAndFlush(any()) } answers { firstArg() }
        every { feedPostReportRepository.countByPostId(POST_ID) } returns 1
    }

    @Test
    fun `신고하면 누가 어느 게시물을 신고했는지 남는다`() {
        // given
        val saved = slot<FeedPostReport>()

        // when
        feedPostReportService.report(REPORTER_ID, POST_ID)

        // then
        verify { feedPostReportRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.reporterId).isEqualTo(REPORTER_ID)
        assertThat(saved.captured.postId).isEqualTo(POST_ID)
    }

    @Test
    fun `신고가 쌓이면 게시물이 지워진다`() {
        // given
        every {
            feedPostReportRepository.countByPostId(POST_ID)
        } returns FeedPostReportService.AUTO_DELETE_REPORT_COUNT.toLong()

        // when
        feedPostReportService.report(REPORTER_ID, POST_ID)

        // then
        verify { feedPostRepository.delete(any()) }
    }

    @Test
    fun `신고가 기준에 못 미치면 게시물이 남는다`() {
        // given
        every {
            feedPostReportRepository.countByPostId(POST_ID)
        } returns FeedPostReportService.AUTO_DELETE_REPORT_COUNT - 1L

        // when
        feedPostReportService.report(REPORTER_ID, POST_ID)

        // then
        verify(exactly = 0) { feedPostRepository.delete(any()) }
    }

    @Test
    fun `내 게시물은 신고할 수 없다`() {
        // given
        every { feedPostRepository.findById(POST_ID) } returns Optional.of(post(REPORTER_ID))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            feedPostReportService.report(REPORTER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_REPORT)
        verify(exactly = 0) { feedPostReportRepository.saveAndFlush(any()) }
    }

    @Test
    fun `같은 게시물을 두 번 신고할 수 없다`() {
        // given
        every { feedPostReportRepository.existsByReporterIdAndPostId(REPORTER_ID, POST_ID) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            feedPostReportService.report(REPORTER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_FEED_POST_REPORT)
        verify(exactly = 0) { feedPostReportRepository.saveAndFlush(any()) }
    }

    @Test
    fun `없는 게시물이면 실패한다`() {
        // given
        every { feedPostRepository.findById(POST_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            feedPostReportService.report(REPORTER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.FEED_POST_NOT_FOUND)
    }

    private fun post(memberId: Long) = FeedPost(
        memberId = memberId,
        slotAt = Instant.parse("2026-08-02T05:00:00Z"),
        objectKey = "feeds/$memberId/photo.jpg",
    )

    companion object {

        private const val REPORTER_ID = 1L
        private const val AUTHOR_ID = 2L
        private const val POST_ID = 10L
    }
}
