package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.domain.admin.dto.DailyCount
import com.blueoauld.server.domain.admin.dto.GenderBirthYearCount
import com.blueoauld.server.domain.admin.dto.MemberNickname
import com.blueoauld.server.domain.member.entity.Member
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

    @Query(
        """
        select m.id
        from Member m
        where m.feedNotificationEnabled = true
          and not exists (
            select 1 from FeedPost p
            where p.memberId = m.id and p.slotAt = :slotAt
          )
          and not exists (
            select 1 from MemberSuspension s
            where s.phoneNumber = m.phoneNumber
              and s.type = com.blueoauld.server.domain.suspension.entity.type.SuspensionType.SERVICE
              and s.releasedAt is null
              and (s.expiresAt is null or s.expiresAt > :now)
          )
        """,
    )
    fun findFeedReminderTargets(@Param("slotAt") slotAt: Instant, @Param("now") now: Instant): List<Long>

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

    @Query(value = "select count(*) from member where created_at >= :start", nativeQuery = true)
    fun countCreatedSince(@Param("start") start: Instant): Long

    @Query(value = "select count(*) from member where deleted_at >= :start", nativeQuery = true)
    fun countDeletedSince(@Param("start") start: Instant): Long

    @Query(
        value = """
        select cast(created_at at time zone 'Asia/Seoul' as date) as day, count(*) as count
        from member
        where created_at >= :start
        group by day
        """,
        nativeQuery = true,
    )
    fun countDailyCreatedSince(@Param("start") start: Instant): List<DailyCount>

    @Query(
        value = """
        select cast(deleted_at at time zone 'Asia/Seoul' as date) as day, count(*) as count
        from member
        where deleted_at >= :start
        group by day
        """,
        nativeQuery = true,
    )
    fun countDailyDeletedSince(@Param("start") start: Instant): List<DailyCount>

    @Query(
        value = """
        select gender as gender, birth_year as birthYear, count(*) as count
        from member
        where deleted_at is null
        group by gender, birth_year
        """,
        nativeQuery = true,
    )
    fun countByGenderAndBirthYear(): List<GenderBirthYearCount>

    @Query(value = "select id as id, nickname as nickname from member where id in (:ids)", nativeQuery = true)
    fun findNicknamesByIdIn(@Param("ids") ids: Collection<Long>): List<MemberNickname>
}
