package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.entity.WorryComment
import com.blueoauld.server.domain.worry.entity.WorryCommentReport
import com.blueoauld.server.domain.worry.event.WorryCommentAutoDeletedEvent
import com.blueoauld.server.domain.worry.repository.WorryCommentReportRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
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
import org.springframework.context.ApplicationEventPublisher
import java.util.*

class WorryCommentReportServiceTest {

    private val worryCommentReportRepository = mockk<WorryCommentReportRepository>(relaxed = true)

    private val worryCommentRepository = mockk<WorryCommentRepository>(relaxed = true)

    private val worryPostRepository = mockk<WorryPostRepository>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val worryCommentReportService = WorryCommentReportService(
        worryCommentReportRepository,
        worryCommentRepository,
        worryPostRepository,
        eventPublisher,
    )

    @BeforeEach
    fun setUp() {
        every { worryCommentRepository.findById(COMMENT_ID) } returns Optional.of(comment(AUTHOR_ID))
        every { worryCommentReportRepository.existsByReporterIdAndCommentId(any(), any()) } returns false
        every { worryCommentReportRepository.saveAndFlush(any()) } answers { firstArg() }
        every { worryCommentRepository.saveAndFlush(any()) } answers { firstArg() }
        every { worryCommentReportRepository.countByCommentId(COMMENT_ID) } returns 1
    }

    @Test
    fun `신고하면 누가 어느 댓글을 신고했는지 남는다`() {
        // given
        val saved = slot<WorryCommentReport>()

        // when
        worryCommentReportService.report(REPORTER_ID, COMMENT_ID)

        // then
        verify { worryCommentReportRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.reporterId).isEqualTo(REPORTER_ID)
        assertThat(saved.captured.commentId).isEqualTo(COMMENT_ID)
    }

    @Test
    fun `신고가 쌓이면 신고 삭제로 표시한 뒤 지우고 글의 댓글 수를 줄인다`() {
        // given
        val comment = comment(AUTHOR_ID)
        every { worryCommentRepository.findById(COMMENT_ID) } returns Optional.of(comment)
        every {
            worryCommentReportRepository.countByCommentId(COMMENT_ID)
        } returns WorryCommentReportService.AUTO_DELETE_REPORT_COUNT.toLong()

        // when
        worryCommentReportService.report(REPORTER_ID, COMMENT_ID)

        // then
        assertThat(comment.deletedByReport).isTrue()
        verify { worryCommentRepository.delete(comment) }
        verify { worryPostRepository.decreaseCommentCount(POST_ID) }
    }

    @Test
    fun `자동 삭제하면 알릴 이벤트를 발행한다`() {
        // given
        every {
            worryCommentReportRepository.countByCommentId(COMMENT_ID)
        } returns WorryCommentReportService.AUTO_DELETE_REPORT_COUNT.toLong()
        val event = slot<WorryCommentAutoDeletedEvent>()

        // when
        worryCommentReportService.report(REPORTER_ID, COMMENT_ID)

        // then
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.memberId).isEqualTo(AUTHOR_ID)
        assertThat(event.captured.postId).isEqualTo(POST_ID)
        assertThat(event.captured.reportCount)
            .isEqualTo(WorryCommentReportService.AUTO_DELETE_REPORT_COUNT.toLong())
    }

    @Test
    fun `신고가 기준에 못 미치면 댓글이 남는다`() {
        // given
        every {
            worryCommentReportRepository.countByCommentId(COMMENT_ID)
        } returns WorryCommentReportService.AUTO_DELETE_REPORT_COUNT - 1L

        // when
        worryCommentReportService.report(REPORTER_ID, COMMENT_ID)

        // then
        verify(exactly = 0) { worryCommentRepository.delete(any()) }
        verify(exactly = 0) { eventPublisher.publishEvent(any()) }
    }

    @Test
    fun `내 댓글은 신고할 수 없다`() {
        // given
        every { worryCommentRepository.findById(COMMENT_ID) } returns Optional.of(comment(REPORTER_ID))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentReportService.report(REPORTER_ID, COMMENT_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_REPORT)
        verify(exactly = 0) { worryCommentReportRepository.saveAndFlush(any()) }
    }

    @Test
    fun `같은 댓글을 두 번 신고할 수 없다`() {
        // given
        every { worryCommentReportRepository.existsByReporterIdAndCommentId(REPORTER_ID, COMMENT_ID) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentReportService.report(REPORTER_ID, COMMENT_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_WORRY_COMMENT_REPORT)
        verify(exactly = 0) { worryCommentReportRepository.saveAndFlush(any()) }
    }

    @Test
    fun `없는 댓글이면 실패한다`() {
        // given
        every { worryCommentRepository.findById(COMMENT_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentReportService.report(REPORTER_ID, COMMENT_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_COMMENT_NOT_FOUND)
    }

    private fun comment(memberId: Long) = WorryComment(
        postId = POST_ID,
        memberId = memberId,
        content = "댓글 내용",
        anonymousNo = 1,
    )

    companion object {

        private const val REPORTER_ID = 1L
        private const val AUTHOR_ID = 2L
        private const val POST_ID = 10L
        private const val COMMENT_ID = 100L
    }
}
