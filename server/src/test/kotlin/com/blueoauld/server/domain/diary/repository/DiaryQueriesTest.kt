package com.blueoauld.server.domain.diary.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.diary.entity.Diary
import com.blueoauld.server.domain.diary.entity.DiaryAttachment
import com.blueoauld.server.domain.diary.entity.type.DiaryAttachmentType
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
class DiaryQueriesTest {

    @Autowired
    private lateinit var diaryRepository: DiaryRepository

    @Autowired
    private lateinit var diaryAttachmentRepository: DiaryAttachmentRepository

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
    fun `내용 없는 일기도 날짜로 찾는다`() {
        // given
        val date = LocalDate.of(2026, 9, 10)
        diaryRepository.saveAndFlush(Diary(MEMBER_ID, date, null))
        diaryRepository.saveAndFlush(Diary(OTHER_ID, date, "남의 것"))

        // when
        val found = diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, date)

        // then
        assertThat(found).isNotNull()
        assertThat(found?.content).isNull()
    }

    @Test
    fun `첨부는 일기별로 자리 순서대로 나열한다`() {
        // given
        val first = diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 9, 1), "하나"))
        val second = diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 9, 2), "둘"))
        diaryAttachmentRepository.saveAndFlush(attachment(first.id, "a", 1))
        diaryAttachmentRepository.saveAndFlush(attachment(first.id, "b", 0))
        diaryAttachmentRepository.saveAndFlush(attachment(second.id, "c", 0))

        // when
        val ofFirst = diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(first.id)
        val ofBoth = diaryAttachmentRepository.findAllByDiaryIdInOrderByPosition(listOf(first.id, second.id))

        // then
        assertThat(ofFirst.map { it.objectKey }).containsExactly(key("b"), key("a"))
        assertThat(ofBoth.groupBy { it.diaryId }.mapValues { (_, items) -> items.map { it.objectKey } })
            .containsEntry(first.id, listOf(key("b"), key("a")))
            .containsEntry(second.id, listOf(key("c")))
    }

    @Test
    fun `회원의 일기와 첨부를 전부 지우고 지운 파일 키를 모은다`() {
        // given
        val mine = diaryRepository.saveAndFlush(Diary(MEMBER_ID, LocalDate.of(2026, 9, 1), "하나"))
        val other = diaryRepository.saveAndFlush(Diary(OTHER_ID, LocalDate.of(2026, 9, 1), "남의 것"))
        diaryAttachmentRepository.saveAndFlush(attachment(mine.id, "photo", 0))
        diaryAttachmentRepository.saveAndFlush(
            DiaryAttachment(mine.id, DiaryAttachmentType.VIDEO, key("video"), key("thumb"), 3, 1),
        )
        diaryAttachmentRepository.saveAndFlush(attachment(other.id, "other", 0))

        // when
        val objectKeys = diaryAttachmentRepository.findObjectKeysByMemberId(MEMBER_ID)
        diaryAttachmentRepository.deleteAllByMemberId(MEMBER_ID)
        diaryRepository.deleteAllByMemberId(MEMBER_ID)

        // then
        assertThat(objectKeys).containsExactlyInAnyOrder(key("photo"), key("video"), key("thumb"))
        assertThat(diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(mine.id)).isEmpty()
        assertThat(diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(other.id)).hasSize(1)
        assertThat(diaryRepository.findByMemberIdAndEntryDate(MEMBER_ID, LocalDate.of(2026, 9, 1))).isNull()
        assertThat(diaryRepository.findByMemberIdAndEntryDate(OTHER_ID, LocalDate.of(2026, 9, 1))).isNotNull()
    }

    private fun attachment(diaryId: Long, name: String, position: Int) =
        DiaryAttachment(diaryId, DiaryAttachmentType.PHOTO, key(name), position = position)

    private fun key(name: String) = "diaries/$MEMBER_ID/$name"

    companion object {

        private const val MEMBER_ID = 7001L
        private const val OTHER_ID = 7002L
    }
}
