package com.blueoauld.server.domain.diary.repository

import com.blueoauld.server.domain.diary.entity.Diary
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface DiaryRepository : JpaRepository<Diary, Long> {

    fun findByMemberIdAndEntryDate(memberId: Long, entryDate: LocalDate): Diary?

    fun findAllByMemberIdOrderByEntryDate(memberId: Long): List<Diary>

    fun findAllByMemberIdAndEntryDateBetweenOrderByEntryDate(
        memberId: Long,
        from: LocalDate,
        to: LocalDate,
    ): List<Diary>

    @Query(
        value = """
        select *
        from diary d
        where d.member_id = :memberId
          and d.content ilike :keyword escape '\'
          and (cast(:cursor as date) is null or d.entry_date < cast(:cursor as date))
        order by d.entry_date desc
        limit :size
        """,
        nativeQuery = true,
    )
    fun search(
        @Param("memberId") memberId: Long,
        @Param("keyword") keyword: String,
        @Param("cursor") cursor: LocalDate?,
        @Param("size") size: Int,
    ): List<Diary>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Diary d where d.memberId = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
