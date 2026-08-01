package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.domain.member.entity.Member
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MemberRepository : JpaRepository<Member, Long> {

    fun existsByPhoneNumber(phoneNumber: String): Boolean

    fun existsByNicknameIgnoreCase(nickname: String): Boolean

    fun findByPhoneNumber(phoneNumber: String): Member?

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update Member m
        set m.receivedLikeCount = m.receivedLikeCount + 1
        where m.id = :memberId
        """,
    )
    fun increaseReceivedLikeCount(@Param("memberId") memberId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update Member m
        set m.receivedLikeCount = m.receivedLikeCount - 1
        where m.id = :memberId and m.receivedLikeCount > 0
        """,
    )
    fun decreaseReceivedLikeCount(@Param("memberId") memberId: Long)
}
