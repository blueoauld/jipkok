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
          where (c.member_id = me.id and c.phone_number = o.phone_number)
             or (c.member_id = o.id and c.phone_number = me.phone_number)
        )
        """,
        nativeQuery = true,
    )
    fun existsBetween(@Param("memberId") memberId: Long, @Param("otherId") otherId: Long): Boolean

    fun existsByMemberIdAndPhoneNumber(memberId: Long, phoneNumber: String): Boolean

    fun findAllByMemberIdOrderByIdDesc(memberId: Long): List<ContactBlock>

    fun countByMemberId(memberId: Long): Long

    fun deleteByIdAndMemberId(id: Long, memberId: Long): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ContactBlock c where c.memberId = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)

    companion object {

        const val NOT_CONTACT_BLOCKED = """
            not exists (
              select 1 from contact_block c
              where (c.member_id = :memberId and c.phone_number = m.phone_number)
                 or (
                   c.member_id = m.id
                   and c.phone_number = (select me.phone_number from member me where me.id = :memberId)
                 )
            )
        """
    }
}
