package com.blueoauld.server.domain.diary.service

import com.blueoauld.server.domain.diary.entity.Diary
import com.blueoauld.server.domain.diary.repository.DiaryRepository
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
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneOffset

class DiaryServiceTest {

    private val diaryRepository = mockk<DiaryRepository>(relaxed = true)

    private val diaryService = DiaryService(diaryRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @BeforeEach
    fun setUp() {
        every { diaryRepository.findByMemberIdAndEntryDate(any(), any()) } returns null
        every { diaryRepository.saveAndFlush(any()) } answers { firstArg() }
        every { diaryRepository.deleteByMemberIdAndEntryDate(any(), any()) } returns 1
    }

    @Test
    fun `그날 일기가 없으면 새로 만든다`() {
        // given
        val saved = slot<Diary>()

        // when
        diaryService.write(MEMBER_ID, TODAY, "오늘은 집에만 있었다.")

        // then
        verify { diaryRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
        assertThat(saved.captured.entryDate).isEqualTo(TODAY)
        assertThat(saved.captured.content).isEqualTo("오늘은 집에만 있었다.")
    }

    @Test
    fun `그날 일기가 있으면 내용을 덮어쓴다`() {
        // given
        val diary = Diary(MEMBER_ID, TODAY, "처음 쓴 내용")
        every { diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, TODAY) } returns diary

        // when
        diaryService.write(MEMBER_ID, TODAY, "고쳐 쓴 내용")

        // then
        assertThat(diary.content).isEqualTo("고쳐 쓴 내용")
        verify(exactly = 0) { diaryRepository.saveAndFlush(any()) }
    }

    @Test
    fun `지난 날짜에는 쓸 수 있다`() {
        // when
        diaryService.write(MEMBER_ID, TODAY.minusDays(1), "어제 일기")

        // then
        verify { diaryRepository.saveAndFlush(any()) }
    }

    @Test
    fun `한국 날짜로 오늘까지만 쓸 수 있다`() {
        // when
        val exception = assertThrows(BusinessException::class.java) {
            diaryService.write(MEMBER_ID, TODAY.plusDays(1), "내일 일기")
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.FUTURE_DIARY_DATE)
        verify(exactly = 0) { diaryRepository.saveAndFlush(any()) }
    }

    @Test
    fun `달의 첫날부터 마지막 날까지 조회한다`() {
        // given
        val diary = Diary(MEMBER_ID, LocalDate.of(2026, 2, 3), "내용")
        every {
            diaryRepository.findAllByMemberIdAndEntryDateBetweenOrderByEntryDate(
                MEMBER_ID,
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 2, 28),
            )
        } returns listOf(diary)

        // when
        val responses = diaryService.findMonth(MEMBER_ID, YearMonth.of(2026, 2))

        // then
        assertThat(responses).hasSize(1)
        assertThat(responses[0].entryDate).isEqualTo(LocalDate.of(2026, 2, 3))
        assertThat(responses[0].content).isEqualTo("내용")
    }

    @Test
    fun `내 일기를 날짜로 지운다`() {
        // when
        diaryService.delete(MEMBER_ID, TODAY)

        // then
        verify { diaryRepository.deleteByMemberIdAndEntryDate(MEMBER_ID, TODAY) }
    }

    @Test
    fun `지울 일기가 없으면 실패한다`() {
        // given
        every { diaryRepository.deleteByMemberIdAndEntryDate(MEMBER_ID, TODAY) } returns 0

        // when
        val exception = assertThrows(BusinessException::class.java) {
            diaryService.delete(MEMBER_ID, TODAY)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.DIARY_NOT_FOUND)
    }

    companion object {

        private const val MEMBER_ID = 1L
        private val NOW: Instant = Instant.parse("2026-09-09T15:30:00Z")
        private val TODAY: LocalDate = LocalDate.of(2026, 9, 10)
    }
}
