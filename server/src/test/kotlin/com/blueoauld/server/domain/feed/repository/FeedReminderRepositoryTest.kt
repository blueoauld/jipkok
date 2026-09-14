package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.repository.MemberRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class FeedReminderRepositoryTest {

    @Autowired
    private lateinit var feedReminderRepository: FeedReminderRepository

    @Autowired
    private lateinit var feedPostRepository: FeedPostRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Test
    fun `기준 시각 뒤로 올리지 않았고 알림을 켠 회원만 고른다`() {
        // given
        val recent = save(member("+821077770001"))
        val stale = save(member("+821077770002"))
        val never = save(member("+821077770003"))
        val muted = save(member("+821077770004", feedNotificationEnabled = false))
        val atSince = save(member("+821077770005"))
        val ai = save(member("AI-0000000000001", role = MemberRole.AI))
        savePost(recent.id, NOW.minus(Duration.ofHours(1)))
        savePost(stale.id, NOW.minus(Duration.ofHours(4)))
        savePost(atSince.id, NOW.minus(Duration.ofHours(3)))

        // when
        val targets = feedReminderRepository.findFeedReminderTargets(NOW.minus(Duration.ofHours(3)), NOW)

        // then
        assertThat(targets.map { it.getMemberId() }).containsExactlyInAnyOrder(stale.id, never.id)
        assertThat(targets.map { it.getMemberId() }).doesNotContain(recent.id, muted.id, atSince.id, ai.id)
    }

    private fun savePost(memberId: Long, slotAt: Instant) = feedPostRepository.saveAndFlush(
        FeedPost(memberId = memberId, slotAt = slotAt, objectKey = "feeds/$memberId/$slotAt.jpg"),
    )

    private fun save(member: Member) = memberRepository.saveAndFlush(member)

    private fun member(
        phoneNumber: String,
        feedNotificationEnabled: Boolean = true,
        role: MemberRole = MemberRole.MEMBER,
    ) = Member(
        phoneNumber = phoneNumber,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = phoneNumber.takeLast(10),
        birthYear = 1998,
        role = role,
        feedNotificationEnabled = feedNotificationEnabled,
    )

    companion object {

        private val NOW: Instant = Instant.parse("2026-09-04T03:00:00Z")
    }
}
