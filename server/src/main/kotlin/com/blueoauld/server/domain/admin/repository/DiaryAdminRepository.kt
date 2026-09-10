package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.domain.diary.entity.Diary
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface DiaryAdminRepository : JpaRepository<Diary, Long> {

    @Query(
        value = """
        select *
        from diary d
        where $MEMBER
        order by d.entry_date desc, d.id desc
        limit :size offset :offset
        """,
        nativeQuery = true,
    )
    fun findAllForAdmin(
        @Param("memberId") memberId: Long?,
        @Param("size") size: Int,
        @Param("offset") offset: Int,
    ): List<Diary>

    @Query(
        value = """
        select count(*)
        from diary d
        where $MEMBER
        """,
        nativeQuery = true,
    )
    fun countForAdmin(@Param("memberId") memberId: Long?): Long

    companion object {

        private const val MEMBER = """
            (cast(:memberId as bigint) is null or d.member_id = cast(:memberId as bigint))
        """
    }
}
