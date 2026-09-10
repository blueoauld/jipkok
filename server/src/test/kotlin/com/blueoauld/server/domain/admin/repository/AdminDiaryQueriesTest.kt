package com.blueoauld.server.domain.admin.repository

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
class AdminDiaryQueriesTest {

    @Autowired
    private lateinit var diaryAdminRepository: DiaryAdminRepository

    @Test
    fun `필터가 없으면 모든 회원의 일기를 최신 날짜부터 자른다`() {
        // given
        val oldest = save(ME_ID, LocalDate.of(2026, 9, 1))
        val newest = save(OTHER_ID, LocalDate.of(2026, 9, 9))
        val middle = save(ME_ID, LocalDate.of(2026, 9, 5))

        // when
        val firstPage = diaryAdminRepository.findAllForAdmin(null, 2, 0)
        val secondPage = diaryAdminRepository.findAllForAdmin(null, 2, 2)

        // then
        assertThat(firstPage.map { it.id }).containsExactly(newest, middle)
        assertThat(secondPage.map { it.id }).containsExactly(oldest)
        assertThat(diaryAdminRepository.countForAdmin(null)).isEqualTo(3)
    }

    @Test
    fun `회원 ID를 주면 그 회원의 일기만 준다`() {
        // given
        val mine = save(ME_ID, LocalDate.of(2026, 9, 1))
        save(OTHER_ID, LocalDate.of(2026, 9, 9))

        // when
        val diaries = diaryAdminRepository.findAllForAdmin(ME_ID, 20, 0)

        // then
        assertThat(diaries.map { it.id }).containsExactly(mine)
        assertThat(diaryAdminRepository.countForAdmin(ME_ID)).isEqualTo(1)
    }

    private fun save(memberId: Long, entryDate: LocalDate) =
        diaryAdminRepository.saveAndFlush(Diary(memberId, entryDate, "내용")).id

    companion object {

        private const val ME_ID = 8001L
        private const val OTHER_ID = 8002L
    }
}
