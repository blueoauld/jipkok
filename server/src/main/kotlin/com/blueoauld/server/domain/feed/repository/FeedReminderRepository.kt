package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.feed.dto.projection.FeedReminderTarget
import com.blueoauld.server.domain.member.entity.Member
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface FeedReminderRepository : JpaRepository<Member, Long> {

    @Query(
        """
        select m.id as memberId, m.locale as locale
        from Member m
        where m.feedNotificationEnabled = true
          and not exists (
            select 1 from FeedPost p
            where p.memberId = m.id and p.slotAt >= :since
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
    fun findFeedReminderTargets(
        @Param("since") since: Instant,
        @Param("now") now: Instant,
    ): List<FeedReminderTarget>
}
