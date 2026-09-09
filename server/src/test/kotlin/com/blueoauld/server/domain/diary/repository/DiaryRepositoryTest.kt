package com.blueoauld.server.domain.diary.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.diary.entity.Diary
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class DiaryRepositoryTest {

    @Autowired
    private lateinit var diaryRepository: DiaryRepository

    @Test
    fun `내 것만 그 달 안에서 날짜순으로 나열한다`() {
        // given
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 9, 20), "나중"))
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 9, 1), "첫날"))
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 9, 30), "마지막 날"))
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 8, 31), "지난달"))
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 10, 1), "다음달"))
        diaryRepository.saveAndFlush(Diary(OTHER_ID, LocalDate.of(2026, 9, 10), "남의 것"))

        // when
        val diaries = diaryRepository.findAllByMemberIdAndEntryDateBetweenOrderByEntryDate(
            MEMBER_ID,
            LocalDate.of(2026, 9, 1),
            LocalDate.of(2026, 9, 30),
        )

        // then
        assertThat(diaries.map { it.content }).containsExactly("첫날", "나중", "마지막 날")
    }

    @Test
    fun `날짜로 찾고 지운다`() {
        // given
        val date = LocalDate.of(2026, 9, 10)
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, date, "내용"))
        diaryRepository.saveAndFlush(Diary(OTHER_ID, date, "남의 것"))

        // when
        val found = diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, date)
        val deletedOfOther = diaryRepository.deleteByMemberIdAndEntryDate(OTHER_ID, date.plusDays(1))
        val deleted = diaryRepository.deleteByMemberIdAndEntryDate(MEMBER_ID, date)

        // then
        assertThat(found?.content).isEqualTo("내용")
        assertThat(deletedOfOther).isZero()
        assertThat(deleted).isEqualTo(1)
        assertThat(diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, date)).isNull()
        assertThat(diaryRepository.findByMemberIdAndEntryDate(OTHER_ID, date)).isNotNull()
    }

    @Test
    fun `회원의 일기를 전부 지운다`() {
        // given
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 9, 1), "하나"))
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 9, 2), "둘"))
        diaryRepository.saveAndFlush(Diary(OTHER_ID, LocalDate.of(2026, 9, 1), "남의 것"))

        // when
        diaryRepository.deleteAllByMemberId(MEMBER_ID)

        // then
        assertThat(diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, LocalDate.of(2026, 9, 1))).isNull()
        assertThat(diaryRepository.findByMemberIdAndEntryDate(OTHER_ID, LocalDate.of(2026, 9, 1))).isNotNull()
    }

    companion object {

        private const val MEMBER_ID = 7001L
        private const val OTHER_ID = 7002L
    }
}
