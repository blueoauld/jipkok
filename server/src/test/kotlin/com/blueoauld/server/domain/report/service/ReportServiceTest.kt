package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.photo.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.photo.service.PhotoUploadService
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.dto.request.CreateReportRequest
import com.blueoauld.server.domain.report.entity.Report
import com.blueoauld.server.domain.report.entity.ReportPhoto
import com.blueoauld.server.domain.report.entity.ReportSnapshot
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
import com.blueoauld.server.domain.report.event.PhotoCopy
import com.blueoauld.server.domain.report.event.ReportPhotosCopiedEvent
import com.blueoauld.server.domain.report.repository.ReportPhotoRepository
import com.blueoauld.server.domain.report.repository.ReportRepository
import com.blueoauld.server.domain.report.repository.ReportSnapshotRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.tuple
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import tools.jackson.databind.json.JsonMapper
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class ReportServiceTest {

    private val reportRepository = mockk<ReportRepository>(relaxed = true)

    private val reportPhotoRepository = mockk<ReportPhotoRepository>(relaxed = true)

    private val reportSnapshotRepository = mockk<ReportSnapshotRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>()

    private val memberPhotoRepository = mockk<MemberPhotoRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>(relaxed = true)

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val chatMessageRepository = mockk<ChatMessageRepository>(relaxed = true)

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val reportService = ReportService(
        reportRepository,
        reportPhotoRepository,
        reportSnapshotRepository,
        memberRepository,
        chatRoomRepository,
        ReportSnapshotBuilder(memberPhotoRepository, chatMessageRepository),
        photoUploadService,
        photoStorage,
        JsonMapper.builder().build(),
        eventPublisher,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(REPORTER_ID) } returns Optional.of(member(REPORTER_ID, "신고자"))
        every { memberRepository.findById(REPORTED_MEMBER_ID) } returns Optional.of(member(REPORTED_MEMBER_ID, "피신고자"))
        every { memberPhotoRepository.findAllByMemberId(REPORTED_MEMBER_ID) } returns emptyList()
        every { reportRepository.save(any()) } answers { firstArg() }
        every { reportSnapshotRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `사유와 상세 내용과 증거 사진을 저장한다`() {
        // given
        val report = slot<Report>()
        val photos = slot<List<ReportPhoto>>()

        // when
        reportService.report(
            REPORTER_ID,
            CreateReportRequest(
                reportedMemberId = REPORTED_MEMBER_ID,
                reason = ReportReason.ABUSE,
                detail = "욕설을 했습니다",
                photoKeys = listOf(photoKey("a"), photoKey("b")),
            ),
        )

        // then
        verify { reportRepository.save(capture(report)) }
        verify { reportPhotoRepository.saveAll(capture(photos)) }
        assertThat(report.captured.reporterId).isEqualTo(REPORTER_ID)
        assertThat(report.captured.reportedMemberId).isEqualTo(REPORTED_MEMBER_ID)
        assertThat(report.captured.reason).isEqualTo(ReportReason.ABUSE)
        assertThat(report.captured.detail).isEqualTo("욕설을 했습니다")
        assertThat(photos.captured).extracting("displayOrder", "objectKey")
            .containsExactly(tuple(0, photoKey("a")), tuple(1, photoKey("b")))
    }

    @Test
    fun `증거 사진은 발급 기록에서 확정 처리한다`() {
        // given
        val photoKeys = listOf(photoKey("a"))

        // when
        reportService.report(REPORTER_ID, createReportRequest(photoKeys = photoKeys))

        // then
        verify { photoUploadService.confirm(photoKeys) }
    }

    @Test
    fun `신고 시점의 회원 정보를 스냅샷으로 남긴다`() {
        // given
        val snapshot = slot<ReportSnapshot>()

        // when
        reportService.report(REPORTER_ID, createReportRequest())

        // then
        verify { reportSnapshotRepository.save(capture(snapshot)) }
        assertThat(snapshot.captured.content)
            .contains("\"nickname\":\"신고자\"")
            .contains("\"nickname\":\"피신고자\"")
            .contains("\"birthYear\":1998")
            .contains("\"phoneNumber\":\"+821012345672\"")
    }

    @Test
    fun `피신고자의 공개 사진을 신고 경로로 복사해 스냅샷에 담는다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(REPORTED_MEMBER_ID) } returns listOf(
            MemberPhoto(REPORTED_MEMBER_ID, PhotoVisibility.PUBLIC, 0, "members/2/a.jpg"),
            MemberPhoto(REPORTED_MEMBER_ID, PhotoVisibility.SECRET, 0, "members/2/s.jpg"),
        )
        val events = mutableListOf<Any>()
        val snapshot = slot<ReportSnapshot>()

        // when
        reportService.report(REPORTER_ID, createReportRequest())

        // then
        verify { eventPublisher.publishEvent(capture(events)) }
        verify { reportSnapshotRepository.save(capture(snapshot)) }
        assertThat(events.filterIsInstance<ReportPhotosCopiedEvent>().single().copies)
            .containsExactly(PhotoCopy("members/2/a.jpg", "reports/snapshot/0/a.jpg"))
        assertThat(snapshot.captured.content).contains("reports/snapshot/0/a.jpg")
    }

    @Test
    fun `사진 복사는 신고를 저장하는 동안 하지 않는다`() {
        // given
        every { memberPhotoRepository.findAllByMemberId(REPORTED_MEMBER_ID) } returns listOf(
            MemberPhoto(REPORTED_MEMBER_ID, PhotoVisibility.PUBLIC, 0, "members/2/a.jpg"),
        )

        // when
        reportService.report(REPORTER_ID, createReportRequest())

        // then
        verify(exactly = 0) { photoStorage.copy(any(), any()) }
    }

    @Test
    fun `자기 자신은 신고할 수 없다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.report(REPORTER_ID, createReportRequest(reportedMemberId = REPORTER_ID))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.SELF_REPORT)
        verify(exactly = 0) { reportRepository.save(any()) }
    }

    @Test
    fun `없는 회원은 신고할 수 없다`() {
        // given
        every { memberRepository.findById(REPORTED_MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.report(REPORTER_ID, createReportRequest())
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { reportRepository.save(any()) }
    }

    @Test
    fun `채팅 신고면 대화 내용을 남긴다`() {
        // given
        val room = ChatRoom.of(REPORTER_ID, REPORTED_MEMBER_ID)
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(room)
        every {
            chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(any(), any(), any())
        } returns listOf(
            ChatMessage(ROOM_ID, REPORTED_MEMBER_ID, ChatMessageType.TEXT, content = "두 번째"),
            ChatMessage(ROOM_ID, REPORTER_ID, ChatMessageType.TEXT, content = "첫 번째"),
        )
        val saved = slot<Report>()
        val snapshot = slot<ReportSnapshot>()

        // when
        reportService.report(REPORTER_ID, createReportRequest(roomId = ROOM_ID))

        // then
        verify { reportRepository.save(capture(saved)) }
        verify { reportSnapshotRepository.save(capture(snapshot)) }
        assertThat(saved.captured.type).isEqualTo(ReportType.CHAT)
        assertThat(saved.captured.roomId).isEqualTo(room.id)
        assertThat(snapshot.captured.content).contains("첫 번째", "두 번째")
    }

    @Test
    fun `참여자가 아닌 방은 신고할 수 없다`() {
        // given
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(ChatRoom.of(REPORTED_MEMBER_ID, 999L))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.report(REPORTER_ID, createReportRequest(roomId = ROOM_ID))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.CHAT_ROOM_NOT_FOUND)
        verify(exactly = 0) { reportRepository.save(any()) }
    }

    @Test
    fun `프로필 신고면 대화 내용이 없다`() {
        // given
        val saved = slot<Report>()

        // when
        reportService.report(REPORTER_ID, createReportRequest())

        // then
        verify { reportRepository.save(capture(saved)) }
        assertThat(saved.captured.type).isEqualTo(ReportType.PROFILE)
        assertThat(saved.captured.roomId).isNull()
        verify(exactly = 0) { chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(any(), any(), any()) }
    }

    @Test
    fun `같은 회원을 여러 번 신고할 수 있다`() {
        // when
        reportService.report(REPORTER_ID, createReportRequest())
        reportService.report(REPORTER_ID, createReportRequest())

        // then
        verify(exactly = 2) { reportRepository.save(any()) }
    }

    @Test
    fun `남의 증거 사진 키를 보내면 신고에 실패한다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.report(REPORTER_ID, createReportRequest(photoKeys = listOf("reports/evidence/999/other.jpg")))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { reportRepository.save(any()) }
    }

    @Test
    fun `증거 사진 업로드 URL은 신고 폴더 아래로 발급한다`() {
        // given
        val prefix = slot<String>()
        every { photoUploadService.createUploadUrl(any(), capture(prefix), any()) } returns
            PhotoUploadUrlResponse("https://upload.test/key", "reports/evidence/$REPORTER_ID/key.jpg")

        // when
        val response = reportService.createPhotoUploadUrl(
            REPORTER_ID,
            CreatePhotoUploadUrlRequest("image/jpeg"),
        )

        // then
        assertThat(prefix.captured).isEqualTo("reports/evidence/$REPORTER_ID/")
        assertThat(response.objectKey).isEqualTo("reports/evidence/$REPORTER_ID/key.jpg")
    }

    @Test
    fun `신고를 처리하면 처리 시각이 남는다`() {
        // given
        val report = Report(
            reporterId = REPORTER_ID,
            reportedMemberId = REPORTED_MEMBER_ID,
            type = ReportType.PROFILE,
            reason = ReportReason.ABUSE,
        )
        every { reportRepository.findById(REPORT_ID) } returns Optional.of(report)

        // when
        val handled = reportService.handle(REPORT_ID)

        // then
        assertThat(handled).isTrue()
        assertThat(report.handledAt).isEqualTo(NOW)
    }

    @Test
    fun `이미 처리된 신고는 처리 시각을 유지한다`() {
        // given
        val firstHandledAt = NOW.minusSeconds(3600)
        val report = Report(
            reporterId = REPORTER_ID,
            reportedMemberId = REPORTED_MEMBER_ID,
            type = ReportType.PROFILE,
            reason = ReportReason.ABUSE,
        ).apply { handledAt = firstHandledAt }
        every { reportRepository.findById(REPORT_ID) } returns Optional.of(report)

        // when
        val handled = reportService.handle(REPORT_ID)

        // then
        assertThat(handled).isFalse()
        assertThat(report.handledAt).isEqualTo(firstHandledAt)
    }

    @Test
    fun `없는 신고는 처리할 수 없다`() {
        // given
        every { reportRepository.findById(REPORT_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.handle(REPORT_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.REPORT_NOT_FOUND)
    }

    private fun createReportRequest(
        reportedMemberId: Long = REPORTED_MEMBER_ID,
        photoKeys: List<String> = emptyList(),
        roomId: Long? = null,
    ) = CreateReportRequest(
        reportedMemberId = reportedMemberId,
        roomId = roomId,
        reason = ReportReason.ABUSE,
        photoKeys = photoKeys,
    )

    private fun photoKey(name: String) = "reports/evidence/$REPORTER_ID/$name.jpg"

    @Test
    fun `상세는 스냅샷을 풀고 사진마다 서명 URL을 만든다`() {
        // given
        val report = Report(
            reporterId = REPORTER_ID,
            reportedMemberId = REPORTED_MEMBER_ID,
            type = ReportType.CHAT,
            roomId = ROOM_ID,
            reason = ReportReason.ABUSE,
        )
        every { reportRepository.findById(REPORT_ID) } returns Optional.of(report)
        every { reportSnapshotRepository.findByReportId(REPORT_ID) } returns
            ReportSnapshot(REPORT_ID, JsonMapper.builder().build().writeValueAsString(snapshotContent()))
        every { reportPhotoRepository.findByReportIdOrderByDisplayOrder(REPORT_ID) } returns
            listOf(ReportPhoto(REPORT_ID, 0, "reports/evidence/1/e.jpg"))
        every { photoStorage.createSignedViewUrl(any()) } answers { "https://signed/${firstArg<String>()}" }

        // when
        val detail = reportService.findDetail(REPORT_ID)

        // then
        assertThat(detail.snapshot.reported.nickname).isEqualTo("피신고자")
        assertThat(detail.messagePhotoUrls).containsEntry(7L, "https://signed/reports/snapshot/1/m.jpg")
        assertThat(detail.evidencePhotoUrls).containsExactly("https://signed/reports/evidence/1/e.jpg")
        assertThat(detail.profilePhotoUrls).containsExactly("https://signed/reports/snapshot/1/p.jpg")
    }

    @Test
    fun `스냅샷이 없으면 상세를 볼 수 없다`() {
        // given
        every { reportRepository.findById(REPORT_ID) } returns Optional.of(
            Report(
                reporterId = REPORTER_ID,
                reportedMemberId = REPORTED_MEMBER_ID,
                type = ReportType.PROFILE,
                reason = ReportReason.ABUSE,
            ),
        )
        every { reportSnapshotRepository.findByReportId(REPORT_ID) } returns null

        // when
        val exception = assertThrows(BusinessException::class.java) {
            reportService.findDetail(REPORT_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.REPORT_NOT_FOUND)
    }

    private fun snapshotContent() = ReportSnapshotContent(
        reporter = ReporterSnapshot(REPORTER_ID, "신고자"),
        reported = ReportedMemberSnapshot(
            memberId = REPORTED_MEMBER_ID,
            phoneNumber = "+821011112222",
            nickname = "피신고자",
            gender = Gender.FEMALE,
            birthYear = 1998,
            comment = null,
            bio = null,
            photoKeys = listOf("reports/snapshot/1/p.jpg"),
        ),
        messages = listOf(
            ChatMessageSnapshot(
                messageId = 7L,
                senderId = REPORTED_MEMBER_ID,
                type = ChatMessageType.PHOTO,
                content = null,
                photoKey = "reports/snapshot/1/m.jpg",
                createdAt = NOW,
            ),
        ),
    )

    private fun member(id: Long, nickname: String) = mockk<Member>(relaxed = true) {
        every { this@mockk.id } returns id
        every { this@mockk.nickname } returns nickname
        every { phoneNumber } returns "+82101234567$id"
        every { gender } returns Gender.MALE
        every { birthYear } returns 1998
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-06T12:00:00Z")
        private const val REPORT_ID = 100L
        private const val ROOM_ID = 10L
        private const val REPORTER_ID = 1L
        private const val REPORTED_MEMBER_ID = 2L
    }
}
