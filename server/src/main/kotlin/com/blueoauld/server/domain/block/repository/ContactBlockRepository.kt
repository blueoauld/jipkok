package com.blueoauld.server.domain.block.repository

import com.blueoauld.server.domain.block.entity.ContactBlock
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ContactBlockRepository : JpaRepository<ContactBlock, Long> {

    @Query(
        value = """
        select exists (
          select 1
          from contact_block c
          join member me on me.id = :memberId
          join member o on o.id = :otherId
          where (c.member_id = me.id and c.phone_hash = o.phone_hash)
             or (c.member_id = o.id and c.phone_hash = me.phone_hash)
        )
        """,
        nativeQuery = true,
    )
    fun existsBetween(@Param("memberId") memberId: Long, @Param("otherId") otherId: Long): Boolean

    fun countByMemberId(memberId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ContactBlock c where c.memberId = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
