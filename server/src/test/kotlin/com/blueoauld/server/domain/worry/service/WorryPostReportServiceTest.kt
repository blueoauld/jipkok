package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.WorryPostReport
import com.blueoauld.server.domain.worry.event.WorryPostReportedEvent
import com.blueoauld.server.domain.worry.repository.WorryPostReportRepository
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

class WorryPostReportServiceTest {

    private val worryPostReportRepository = mockk<WorryPostReportRepository>(relaxed = true)

    private val worryPostRepository = mockk<WorryPostRepository>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val worryPostReportService = WorryPostReportService(
        worryPostReportRepository,
        worryPostRepository,
        eventPublisher,
    )

    @BeforeEach
    fun setUp() {
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post(AUTHOR_ID))
        every { worryPostReportRepository.existsByReporterIdAndPostId(any(), any()) } returns false
        every { worryPostReportRepository.saveAndFlush(any()) } answers { firstArg() }
        every { worryPostReportRepository.countByPostId(POST_ID) } returns 1
    }

    @Test
    fun `신고하면 누가 어느 글을 신고했는지 남는다`() {
        // given
        val saved = slot<WorryPostReport>()

        // when
        worryPostReportService.report(REPORTER_ID, POST_ID)

        // then
        verify { worryPostReportRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.reporterId).isEqualTo(REPORTER_ID)
        assertThat(saved.captured.postId).isEqualTo(POST_ID)
    }

    @Test
    fun `신고가 기준에 닿으면 글은 남기고 알릴 이벤트만 발행한다`() {
        // given
        every {
            worryPostReportRepository.countByPostId(POST_ID)
        } returns WorryPostReportService.NOTIFY_REPORT_COUNT.toLong()
        val event = slot<WorryPostReportedEvent>()

        // when
        worryPostReportService.report(REPORTER_ID, POST_ID)

        // then
        verify(exactly = 0) { worryPostRepository.delete(any()) }
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.memberId).isEqualTo(AUTHOR_ID)
        assertThat(event.captured.reportCount).isEqualTo(WorryPostReportService.NOTIFY_REPORT_COUNT.toLong())
    }

    @Test
    fun `신고가 기준에 못 미치면 알리지 않는다`() {
        // given
        every {
            worryPostReportRepository.countByPostId(POST_ID)
        } returns WorryPostReportService.NOTIFY_REPORT_COUNT - 1L

        // when
        worryPostReportService.report(REPORTER_ID, POST_ID)

        // then
        verify(exactly = 0) { eventPublisher.publishEvent(any()) }
    }

    @Test
    fun `기준을 이미 넘긴 뒤에는 다시 알리지 않는다`() {
        // given
        every {
            worryPostReportRepository.countByPostId(POST_ID)
        } returns WorryPostReportService.NOTIFY_REPORT_COUNT + 1L

        // when
        worryPostReportService.report(REPORTER_ID, POST_ID)

        // then
        verify(exactly = 0) { eventPublisher.publishEvent(any()) }
    }

    @Test
    fun `내 글은 신고할 수 없다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post(REPORTER_ID))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryPostReportService.report(REPORTER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_REPORT)
        verify(exactly = 0) { worryPostReportRepository.saveAndFlush(any()) }
    }

    @Test
    fun `같은 글을 두 번 신고할 수 없다`() {
        // given
        every { worryPostReportRepository.existsByReporterIdAndPostId(REPORTER_ID, POST_ID) } returns true

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryPostReportService.report(REPORTER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DUPLICATE_WORRY_POST_REPORT)
        verify(exactly = 0) { worryPostReportRepository.saveAndFlush(any()) }
    }

    @Test
    fun `없는 글이면 실패한다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryPostReportService.report(REPORTER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_POST_NOT_FOUND)
    }

    private fun post(memberId: Long) = WorryPost(memberId = memberId, content = "고민 내용")

    companion object {

        private const val REPORTER_ID = 1L
        private const val AUTHOR_ID = 2L
        private const val POST_ID = 10L
    }
}
