package com.blueoauld.server.domain.diary.service

import com.blueoauld.server.domain.diary.dto.request.DiaryAttachmentRequest
import com.blueoauld.server.domain.diary.dto.request.WriteDiaryRequest
import com.blueoauld.server.domain.diary.entity.Diary
import com.blueoauld.server.domain.diary.entity.DiaryAttachment
import com.blueoauld.server.domain.diary.entity.type.DiaryAttachmentType
import com.blueoauld.server.domain.diary.entity.type.DiaryMood
import com.blueoauld.server.domain.diary.repository.DiaryAttachmentRepository
import com.blueoauld.server.domain.diary.repository.DiaryRepository
import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.domain.photo.service.PhotoUploadService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.StoredObject
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneOffset

class DiaryServiceTest {

    private val diaryRepository = mockk<DiaryRepository>(relaxed = true)

    private val diaryAttachmentRepository = mockk<DiaryAttachmentRepository>(relaxed = true)

    private val photoUploadService = mockk<PhotoUploadService>()

    private val photoStorage = mockk<PhotoStorage>()

    private val eventPublisher = mockk<ApplicationEventPublisher>(relaxed = true)

    private val diaryService = DiaryService(
        diaryRepository,
        diaryAttachmentRepository,
        photoUploadService,
        photoStorage,
        eventPublisher,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { diaryRepository.findByMemberIdAndEntryDate(any(), any()) } returns null
        every { diaryRepository.saveAndFlush(any()) } answers { firstArg() }
        every { diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(any()) } returns emptyList()
        every { diaryAttachmentRepository.save(any()) } answers { firstArg() }
        every { photoUploadService.confirm(emptyList()) } returns emptyMap()
        every { photoStorage.createSignedViewUrl(any()) } answers { "https://signed/${firstArg<String>()}" }
    }

    @Test
    fun `그날 일기가 없으면 새로 만든다`() {
        // given
        val saved = slot<Diary>()

        // when
        diaryService.write(MEMBER_ID, TODAY, WriteDiaryRequest(" 오늘은 집에만 있었다. ", DiaryMood.STAR))

        // then
        verify { diaryRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
        assertThat(saved.captured.entryDate).isEqualTo(TODAY)
        assertThat(saved.captured.content).isEqualTo("오늘은 집에만 있었다.")
        assertThat(saved.captured.mood).isEqualTo(DiaryMood.STAR)
    }

    @Test
    fun `그날 일기가 있으면 내용과 기분을 덮어쓴다`() {
        // given
        val diary = Diary(MEMBER_ID, TODAY, "처음 쓴 내용", DiaryMood.HEART)
        every { diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, TODAY) } returns diary

        // when
        diaryService.write(MEMBER_ID, TODAY, WriteDiaryRequest("고쳐 쓴 내용", DiaryMood.RAIN))

        // then
        assertThat(diary.content).isEqualTo("고쳐 쓴 내용")
        assertThat(diary.mood).isEqualTo(DiaryMood.RAIN)
        verify(exactly = 0) { diaryRepository.saveAndFlush(any()) }
    }

    @Test
    fun `기분을 비우면 지워진다`() {
        // given
        val diary = Diary(MEMBER_ID, TODAY, "내용", DiaryMood.HEART)
        every { diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, TODAY) } returns diary

        // when
        diaryService.write(MEMBER_ID, TODAY, request("내용"))

        // then
        assertThat(diary.mood).isNull()
    }

    @Test
    fun `지난 날짜에는 쓸 수 있다`() {
        // when
        diaryService.write(MEMBER_ID, TODAY.minusDays(1), request("어제 일기"))

        // then
        verify { diaryRepository.saveAndFlush(any()) }
    }

    @Test
    fun `한국 날짜로 오늘까지만 쓸 수 있다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            diaryService.write(MEMBER_ID, TODAY.plusDays(1), request("내일 일기"))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.FUTURE_DIARY_DATE)
        verify(exactly = 0) { diaryRepository.saveAndFlush(any()) }
    }

    @Test
    fun `내용도 첨부도 없으면 실패한다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            diaryService.write(MEMBER_ID, TODAY, request("  "))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.EMPTY_DIARY)
    }

    @Test
    fun `첨부만 있으면 내용 없이도 저장한다`() {
        // given
        val saved = slot<Diary>()
        every { photoUploadService.confirm(listOf(PHOTO_KEY)) } returns mapOf(PHOTO_KEY to photo())

        // when
        diaryService.write(MEMBER_ID, TODAY, request("", DiaryAttachmentRequest(PHOTO_KEY)))

        // then
        verify { diaryRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.content).isNull()
    }

    @Test
    fun `새 첨부는 업로드를 확정한 뒤 보낸 순서대로 붙인다`() {
        // given
        val saved = mutableListOf<DiaryAttachment>()
        every { photoUploadService.confirm(listOf(PHOTO_KEY, VIDEO_KEY, THUMBNAIL_KEY)) } returns mapOf(
            PHOTO_KEY to photo(),
            VIDEO_KEY to video(),
            THUMBNAIL_KEY to photo(),
        )

        // when
        diaryService.write(
            MEMBER_ID,
            TODAY,
            request(
                "내용",
                DiaryAttachmentRequest(PHOTO_KEY),
                DiaryAttachmentRequest(VIDEO_KEY, THUMBNAIL_KEY, 12),
            ),
        )

        // then
        verify { diaryAttachmentRepository.save(capture(saved)) }
        assertThat(saved.map { it.type }).containsExactly(DiaryAttachmentType.PHOTO, DiaryAttachmentType.VIDEO)
        assertThat(saved.map { it.position }).containsExactly(0, 1)
        assertThat(saved[1].thumbnailObjectKey).isEqualTo(THUMBNAIL_KEY)
        assertThat(saved[1].durationSeconds).isEqualTo(12)
        verify(exactly = 0) { eventPublisher.publishEvent(any<PhotosDeletedEvent>()) }
    }

    @Test
    fun `빠진 첨부는 지우고 남긴 첨부는 자리만 옮긴다`() {
        // given
        val diary = Diary(MEMBER_ID, TODAY, "내용")
        val first = DiaryAttachment(0, DiaryAttachmentType.PHOTO, "$PREFIX/first.webp", position = 0)
        val second = DiaryAttachment(0, DiaryAttachmentType.VIDEO, "$PREFIX/second.mp4", "$PREFIX/second.jpg", 5, 1)
        val event = slot<PhotosDeletedEvent>()
        every { diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, TODAY) } returns diary
        every { diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(diary.id) } returns listOf(first, second)
        every { photoUploadService.confirm(listOf(PHOTO_KEY)) } returns mapOf(PHOTO_KEY to photo())

        // when
        diaryService.write(
            MEMBER_ID,
            TODAY,
            request("내용", DiaryAttachmentRequest(PHOTO_KEY), DiaryAttachmentRequest(first.objectKey)),
        )

        // then
        verify { diaryAttachmentRepository.deleteAll(listOf(second)) }
        assertThat(first.position).isEqualTo(1)
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.objectKeys).containsExactly("$PREFIX/second.mp4", "$PREFIX/second.jpg")
    }

    @Test
    fun `다른 회원 경로의 키는 받지 않는다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            diaryService.write(MEMBER_ID, TODAY, request("내용", DiaryAttachmentRequest("diaries/999/a.webp")))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        verify(exactly = 0) { photoUploadService.confirm(any()) }
    }

    @Test
    fun `확정되지 않은 키는 받지 않는다`() {
        // given
        every { photoUploadService.confirm(listOf(PHOTO_KEY)) } returns emptyMap()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            diaryService.write(MEMBER_ID, TODAY, request("내용", DiaryAttachmentRequest(PHOTO_KEY)))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
    }

    @Test
    fun `동영상에는 썸네일과 길이가 있어야 한다`() {
        // given
        every { photoUploadService.confirm(listOf(VIDEO_KEY)) } returns mapOf(VIDEO_KEY to video())
        every { photoUploadService.confirm(listOf(VIDEO_KEY, THUMBNAIL_KEY)) } returns mapOf(
            VIDEO_KEY to video(),
            THUMBNAIL_KEY to photo(),
        )

        // when
        val withoutThumbnail = assertThrows(BusinessException::class.java) {
            diaryService.write(MEMBER_ID, TODAY, request("내용", DiaryAttachmentRequest(VIDEO_KEY, null, 12)))
        }
        val withoutDuration = assertThrows(BusinessException::class.java) {
            diaryService.write(MEMBER_ID, TODAY, request("내용", DiaryAttachmentRequest(VIDEO_KEY, THUMBNAIL_KEY)))
        }
        val tooLong = assertThrows(BusinessException::class.java) {
            diaryService.write(
                MEMBER_ID,
                TODAY,
                request("내용", DiaryAttachmentRequest(VIDEO_KEY, THUMBNAIL_KEY, DiaryAttachment.VIDEO_MAX_SECONDS + 1)),
            )
        }

        // then
        assertThat(withoutThumbnail.errorCode).isEqualTo(ErrorCode.INVALID_PHOTO_KEY)
        assertThat(withoutDuration.errorCode).isEqualTo(ErrorCode.INVALID_REQUEST)
        assertThat(tooLong.errorCode).isEqualTo(ErrorCode.VIDEO_TOO_LONG)
    }

    @Test
    fun `달의 첫날부터 마지막 날까지 조회하고 첨부에 서명 URL을 붙인다`() {
        // given
        val diary = Diary(MEMBER_ID, LocalDate.of(2026, 2, 3), "내용")
        val attachment = DiaryAttachment(diary.id, DiaryAttachmentType.VIDEO, VIDEO_KEY, THUMBNAIL_KEY, 7, 0)
        every {
            diaryRepository.findAllByMemberIdAndEntryDateBetweenOrderByEntryDate(
                MEMBER_ID,
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 2, 28),
            )
        } returns listOf(diary)
        every {
            diaryAttachmentRepository.findAllByDiaryIdInOrderByPosition(listOf(diary.id))
        } returns listOf(attachment)

        // when
        val responses = diaryService.findMonth(MEMBER_ID, YearMonth.of(2026, 2))

        // then
        assertThat(responses).hasSize(1)
        assertThat(responses[0].entryDate).isEqualTo(LocalDate.of(2026, 2, 3))
        assertThat(responses[0].mood).isNull()
        assertThat(responses[0].attachments).hasSize(1)
        assertThat(responses[0].attachments[0].url).isEqualTo("https://signed/$VIDEO_KEY")
        assertThat(responses[0].attachments[0].thumbnailUrl).isEqualTo("https://signed/$THUMBNAIL_KEY")
        assertThat(responses[0].attachments[0].durationSeconds).isEqualTo(7)
    }

    @Test
    fun `검색어는 앞뒤 공백을 떼고 와일드카드를 이스케이프해 부분 일치로 찾는다`() {
        // given
        val keyword = slot<String>()
        every { diaryRepository.search(MEMBER_ID, capture(keyword), null, 20) } returns emptyList()

        // when
        diaryService.search(MEMBER_ID, "  100%  ", null, 20)

        // then
        assertThat(keyword.captured).isEqualTo("%100\\%%")
    }

    @Test
    fun `검색어가 한 글자면 찾지 않는다`() {
        // when
        val response = diaryService.search(MEMBER_ID, "집", null, 20)

        // then
        assertThat(response.items).isEmpty()
        assertThat(response.nextCursor).isNull()
        verify(exactly = 0) { diaryRepository.search(any(), any(), any(), any()) }
    }

    @Test
    fun `검색 커서는 날짜를 epoch day로 주고받는다`() {
        // given
        val first = Diary(MEMBER_ID, LocalDate.of(2026, 9, 9), "오늘은 집에서 쉬었다")
        val second = Diary(MEMBER_ID, LocalDate.of(2026, 9, 8), "오늘은 청소")
        every {
            diaryRepository.search(MEMBER_ID, "%오늘%", LocalDate.of(2026, 9, 10), 2)
        } returns listOf(first, second)
        every { diaryAttachmentRepository.findAllByDiaryIdInOrderByPosition(any()) } returns emptyList()

        // when
        val response = diaryService.search(MEMBER_ID, "오늘", LocalDate.of(2026, 9, 10).toEpochDay(), 2)

        // then
        assertThat(response.items.map { it.entryDate }).containsExactly(first.entryDate, second.entryDate)
        assertThat(response.nextCursor).isEqualTo(second.entryDate.toEpochDay())
    }

    @Test
    fun `일기를 지우면 첨부도 지우고 파일 삭제 이벤트를 낸다`() {
        // given
        val diary = Diary(MEMBER_ID, TODAY, "내용")
        val attachment = DiaryAttachment(diary.id, DiaryAttachmentType.PHOTO, PHOTO_KEY, position = 0)
        val event = slot<PhotosDeletedEvent>()
        every { diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, TODAY) } returns diary
        every { diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(diary.id) } returns listOf(attachment)

        // when
        diaryService.delete(MEMBER_ID, TODAY)

        // then
        verify { diaryAttachmentRepository.deleteAll(listOf(attachment)) }
        verify { diaryRepository.delete(diary) }
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.objectKeys).containsExactly(PHOTO_KEY)
    }

    @Test
    fun `지울 일기가 없으면 실패한다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            diaryService.delete(MEMBER_ID, TODAY)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DIARY_NOT_FOUND)
    }

    @Test
    fun `회원의 일기를 전부 지우고 파일 삭제 이벤트를 낸다`() {
        // given
        val event = slot<PhotosDeletedEvent>()
        every { diaryAttachmentRepository.findObjectKeysByMemberId(MEMBER_ID) } returns listOf(PHOTO_KEY, VIDEO_KEY)

        // when
        diaryService.deleteAll(MEMBER_ID)

        // then
        verify { diaryAttachmentRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { diaryRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { eventPublisher.publishEvent(capture(event)) }
        assertThat(event.captured.objectKeys).containsExactly(PHOTO_KEY, VIDEO_KEY)
    }

    private fun request(content: String, vararg attachments: DiaryAttachmentRequest) =
        WriteDiaryRequest(content, null, attachments.toList())

    private fun photo() = StoredObject(1_000, "image/webp")

    private fun video() = StoredObject(1_000, "video/mp4")

    companion object {

        private const val MEMBER_ID = 1L
        private const val PREFIX = "diaries/$MEMBER_ID"
        private const val PHOTO_KEY = "$PREFIX/photo.webp"
        private const val VIDEO_KEY = "$PREFIX/video.mp4"
        private const val THUMBNAIL_KEY = "$PREFIX/thumbnail.jpg"
        private val NOW: Instant = Instant.parse("2026-09-09T15:30:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 9, 10)
    }
}
