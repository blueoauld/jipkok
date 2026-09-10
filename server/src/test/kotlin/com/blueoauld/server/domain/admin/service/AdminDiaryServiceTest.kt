package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.DiaryAdminRepository
import com.blueoauld.server.domain.diary.entity.Diary
import com.blueoauld.server.domain.diary.entity.DiaryAttachment
import com.blueoauld.server.domain.diary.entity.type.DiaryAttachmentType
import com.blueoauld.server.domain.diary.entity.type.DiaryMood
import com.blueoauld.server.domain.diary.repository.DiaryAttachmentRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.util.*

class AdminDiaryServiceTest {

    private val diaryAdminRepository = mockk<DiaryAdminRepository>()

    private val diaryAttachmentRepository = mockk<DiaryAttachmentRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val photoStorage = mockk<PhotoStorage>()

    private val adminActionRecorder = mockk<AdminActionRecorder>(relaxed = true)

    private val adminDiaryService = AdminDiaryService(
        diaryAdminRepository,
        diaryAttachmentRepository,
        memberAdminService,
        photoStorage,
        adminActionRecorder,
    )

    @Test
    fun `목록은 닉네임과 첫 줄 미리보기, 첨부 수를 채우고 열람을 기록하지 않는다`() {
        // given
        val diary = Diary(MEMBER_ID, LocalDate.of(2026, 9, 9), "첫 줄\n둘째 줄", DiaryMood.CLOVER)
        every { diaryAdminRepository.findAllForAdmin(null, 20, 0) } returns listOf(diary)
        every { memberAdminService.findNicknames(listOf(MEMBER_ID)) } returns mapOf(MEMBER_ID to "밤하늘산책")
        every { diaryAttachmentRepository.findAllByDiaryIdInOrderByPosition(listOf(diary.id)) } returns listOf(
            DiaryAttachment(diary.id, DiaryAttachmentType.PHOTO, "diaries/1/a.webp", position = 0),
            DiaryAttachment(diary.id, DiaryAttachmentType.PHOTO, "diaries/1/b.webp", position = 1),
        )
        every { diaryAdminRepository.countForAdmin(null) } returns 1

        // when
        val response = adminDiaryService.findDiaries(null, 1, 20)

        // then
        val item = response.items.single()
        assertThat(item.member.nickname).isEqualTo("밤하늘산책")
        assertThat(item.contentPreview).isEqualTo("첫 줄")
        assertThat(item.attachmentCount).isEqualTo(2)
        assertThat(response.totalCount).isEqualTo(1)
        verify(exactly = 0) { adminActionRecorder.record(any(), any(), any(), any()) }
    }

    @Test
    fun `목록은 페이지와 크기를 한도 안으로 맞추고 회원 조건을 그대로 넘긴다`() {
        // given
        every { diaryAdminRepository.findAllForAdmin(MEMBER_ID, 100, 0) } returns emptyList()
        every { memberAdminService.findNicknames(emptyList()) } returns emptyMap()
        every { diaryAttachmentRepository.findAllByDiaryIdInOrderByPosition(emptyList()) } returns emptyList()
        every { diaryAdminRepository.countForAdmin(MEMBER_ID) } returns 0

        // when
        val response = adminDiaryService.findDiaries(MEMBER_ID, 0, 999)

        // then
        assertThat(response.page).isEqualTo(1)
        assertThat(response.size).isEqualTo(100)
    }

    @Test
    fun `상세는 본문 전체와 서명한 첨부 URL을 주고 열람을 기록한다`() {
        // given
        val diary = Diary(MEMBER_ID, LocalDate.of(2026, 9, 9), "첫 줄\n둘째 줄", DiaryMood.CLOVER)
        every { diaryAdminRepository.findById(DIARY_ID) } returns Optional.of(diary)
        every { memberAdminService.findNickname(MEMBER_ID) } returns "밤하늘산책"
        every { diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(diary.id) } returns listOf(
            DiaryAttachment(diary.id, DiaryAttachmentType.VIDEO, "diaries/1/v.mp4", "diaries/1/t.jpg", 7, 0),
        )
        every { photoStorage.createSignedViewUrl(any()) } answers { "https://signed/${firstArg<String>()}" }

        // when
        val response = adminDiaryService.findDiary(ACTOR_ID, DIARY_ID)

        // then
        assertThat(response.content).isEqualTo("첫 줄\n둘째 줄")
        assertThat(response.attachments[0].url).isEqualTo("https://signed/diaries/1/v.mp4")
        assertThat(response.attachments[0].thumbnailUrl).isEqualTo("https://signed/diaries/1/t.jpg")
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.VIEW_DIARY, DIARY_ID) }
    }

    @Test
    fun `없는 일기를 열면 예외를 던지고 기록하지 않는다`() {
        // given
        every { diaryAdminRepository.findById(DIARY_ID) } returns Optional.empty()

        // when

        // then
        assertThatThrownBy { adminDiaryService.findDiary(ACTOR_ID, DIARY_ID) }
            .isInstanceOf(BusinessException::class.java)
        verify(exactly = 0) { adminActionRecorder.record(any(), any(), any(), any()) }
    }

    companion object {

        private const val ACTOR_ID = 99L
        private const val MEMBER_ID = 1L
        private const val DIARY_ID = 5L
    }
}
