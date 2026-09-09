package com.blueoauld.server.domain.diary.repository

import com.blueoauld.server.domain.diary.entity.Diary
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface DiaryRepository : JpaRepository<Diary, Long> {

    fun findByMemberIdAndEntryDate(memberId: Long, entryDate: LocalDate): Diary?

    fun findAllByMemberIdAndEntryDateBetweenOrderByEntryDate(
        memberId: Long,
        from: LocalDate,
        to: LocalDate,
    ): List<Diary>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Diary d where d.memberId = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
