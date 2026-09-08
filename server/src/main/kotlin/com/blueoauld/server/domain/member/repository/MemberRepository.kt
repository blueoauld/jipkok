package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.domain.member.dto.projection.MemberNickname
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface MemberRepository : JpaRepository<Member, Long> {

    fun existsByPhoneNumber(phoneNumber: String): Boolean

    @Query(
        """
        select count(m) > 0
        from Member m
        where lower(m.nickname) = lower(:nickname)
        """,
    )
    fun existsByNicknameIgnoreCase(@Param("nickname") nickname: String): Boolean

    fun findByPhoneNumber(phoneNumber: String): Member?

    @Query("select m.locale from Member m where m.id = :memberId")
    fun findLocaleById(@Param("memberId") memberId: Long): MemberLocale?

    @Query("select m.nickname from Member m where m.id = :memberId")
    fun findNicknameById(@Param("memberId") memberId: Long): String?

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

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update Member m
        set m.receivedLikeCount = m.receivedLikeCount - 1
        where m.receivedLikeCount > 0
          and m.id in (select l.likedMemberId from MemberLike l where l.likerId = :likerId)
        """,
    )
    fun decreaseReceivedLikeCountLikedBy(@Param("likerId") likerId: Long)

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update Member m
        set m.pointBalance = m.pointBalance + :amount
        where m.id = :memberId and m.pointBalance + :amount >= 0
        """,
    )
    fun addPointBalance(@Param("memberId") memberId: Long, @Param("amount") amount: Int): Int

    @Query("select m.pointBalance from Member m where m.id = :memberId")
    fun findPointBalance(@Param("memberId") memberId: Long): Int?

    @Query(value = "select id from member where deleted_at < :threshold", nativeQuery = true)
    fun findIdsDeletedBefore(@Param("threshold") threshold: Instant): List<Long>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from member where id in (:memberIds)", nativeQuery = true)
    fun deleteAllByIdIn(@Param("memberIds") memberIds: List<Long>)

    @Query(value = "select id as id, nickname as nickname from member where id in (:ids)", nativeQuery = true)
    fun findNicknamesByIdIn(@Param("ids") ids: Collection<Long>): List<MemberNickname>
}
