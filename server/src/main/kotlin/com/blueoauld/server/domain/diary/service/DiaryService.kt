package com.blueoauld.server.domain.diary.service

import com.blueoauld.server.domain.diary.dto.response.DiaryResponse
import com.blueoauld.server.domain.diary.entity.Diary
import com.blueoauld.server.domain.diary.repository.DiaryRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.time.today
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.YearMonth

@Service
class DiaryService(

    private val diaryRepository: DiaryRepository,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findMonth(memberId: Long, month: YearMonth): List<DiaryResponse> = diaryRepository
        .findAllByMemberIdAndEntryDateBetweenOrderByEntryDate(memberId, month.atDay(1), month.atEndOfMonth())
        .map { DiaryResponse(it.entryDate, it.content, it.updatedAt) }

    @Transactional
    fun write(memberId: Long, entryDate: LocalDate, content: String) {
        if (entryDate.isAfter(clock.today())) {
            throw BusinessException(ErrorCode.FUTURE_DIARY_DATE)
        }

        val diary = diaryRepository.findByMemberIdAndEntryDate(memberId, entryDate)

        if (diary == null) {
            diaryRepository.saveAndFlush(Diary(memberId, entryDate, content))
            return
        }

        diary.content = content
    }

    @Transactional
    fun delete(memberId: Long, entryDate: LocalDate) {
        if (diaryRepository.deleteByMemberIdAndEntryDate(memberId, entryDate) == 0L) {
            throw BusinessException(ErrorCode.DIARY_NOT_FOUND)
        }
    }
}
