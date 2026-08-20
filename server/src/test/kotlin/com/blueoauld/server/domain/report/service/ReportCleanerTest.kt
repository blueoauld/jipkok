package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.entity.ReportPhoto
import com.blueoauld.server.domain.report.entity.ReportSnapshot
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.repository.ReportSnapshotRepository
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import tools.jackson.databind.json.JsonMapper
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class ReportCleanerTest {

    private val reportRepository = mockk<ReportRepository>(relaxed = true)

    private val reportPhotoRepository = mockk<ReportPhotoRepository>(relaxed = true)

    private val reportSnapshotRepository = mockk<ReportSnapshotRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val objectMapper = JsonMapper.builder().build()

    private val cleaner = ReportCleaner(
        reportRepository,
        reportPhotoRepository,
        reportSnapshotRepository,
        photoStorage,
        objectMapper,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { reportRepository.findHandledIdsCreatedBefore(any()) } returns REPORT_IDS
        every { reportPhotoRepository.findAllByReportIdIn(REPORT_IDS) } returns
            listOf(ReportPhoto(REPORT_ID, 0, EVIDENCE_KEY))
        every { reportSnapshotRepository.findAllByReportIdIn(REPORT_IDS) } returns
            listOf(ReportSnapshot(REPORT_ID, objectMapper.writeValueAsString(snapshot())))
    }

    @Test
    fun `보관 기간이 지난 신고는 증거 사진과 스냅샷 속 사진까지 지운다`() {
        // given
        val deleted = slot<List<String>>()

        // when
        cleaner.cleanUpOldReports()

        // then
        verify { reportRepository.findHandledIdsCreatedBefore(NOW.minus(ReportCleaner.RETENTION)) }
        verify { reportPhotoRepository.deleteAllByReportIdIn(REPORT_IDS) }
        verify { reportSnapshotRepository.deleteAllByReportIdIn(REPORT_IDS) }
        verify { reportRepository.deleteAllByIdIn(REPORT_IDS) }
        verify { photoStorage.delete(capture(deleted)) }
        assertThat(deleted.captured).containsExactly(EVIDENCE_KEY, PROFILE_KEY, MESSAGE_KEY)
    }

    @Test
    fun `스냅샷을 읽지 못해도 나머지는 정리한다`() {
        // given
        every { reportSnapshotRepository.findAllByReportIdIn(REPORT_IDS) } returns
            listOf(ReportSnapshot(REPORT_ID, "not json"))

        // when
        cleaner.cleanUpOldReports()

        // then
        verify { reportRepository.deleteAllByIdIn(REPORT_IDS) }
        verify { photoStorage.delete(listOf(EVIDENCE_KEY)) }
    }

    @Test
    fun `지울 신고가 없으면 아무것도 하지 않는다`() {
        // given
        every { reportRepository.findHandledIdsCreatedBefore(any()) } returns emptyList()

        // when
        cleaner.cleanUpOldReports()

        // then
        verify(exactly = 0) { reportRepository.deleteAllByIdIn(any()) }
        verify(exactly = 0) { photoStorage.delete(any()) }
    }

    private fun snapshot() = ReportSnapshotContent(
        reporter = ReporterSnapshot(1L, "신고자"),
        reported = ReportedMemberSnapshot(
            2L,
            "01012345678",
            "피신고자",
            Gender.MALE,
            1998,
            null,
            null,
            listOf(PROFILE_KEY),
        ),
        messages = listOf(
            ChatMessageSnapshot(5L, 2L, ChatMessageType.PHOTO, null, MESSAGE_KEY, NOW),
            ChatMessageSnapshot(6L, 2L, ChatMessageType.TEXT, "안녕", null, NOW),
        ),
    )

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")

        private const val REPORT_ID = 10L
        private val REPORT_IDS = listOf(REPORT_ID)

        private const val EVIDENCE_KEY = "reports/evidence/1/a.jpg"
        private const val PROFILE_KEY = "members/2/public/b.jpg"
        private const val MESSAGE_KEY = "chats/2/c.jpg"
    }
}
