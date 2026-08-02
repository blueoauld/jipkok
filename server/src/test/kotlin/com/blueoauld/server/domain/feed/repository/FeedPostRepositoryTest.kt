package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.domain.block.entity.MemberBlock
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.entity.FeedPostLike
import com.blueoauld.server.domain.feed.entity.FeedPostReport
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@SpringBootTest
@Transactional
class FeedPostRepositoryTest {

    @Autowired
    private lateinit var feedPostRepository: FeedPostRepository

    @Autowired
    private lateinit var feedPostLikeRepository: FeedPostLikeRepository

    @Autowired
    private lateinit var feedPostReportRepository: FeedPostReportRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var memberBlockRepository: MemberBlockRepository

    private var meId: Long = 0

    private var maleId: Long = 0

    private var femaleId: Long = 0

    private var morningPostId: Long = 0

    private var eveningPostId: Long = 0

    private var femalePostId: Long = 0

    @BeforeEach
    fun setUp() {
        meId = save(member("01088880000", Gender.MALE)).id
        maleId = save(member("01088880001", Gender.MALE)).id
        femaleId = save(member("01088880002", Gender.FEMALE)).id

        savePost(maleId, slot(9).minusSeconds(DAY_SECONDS))
        morningPostId = savePost(maleId, slot(9)).id
        femalePostId = savePost(femaleId, slot(12)).id
        eveningPostId = savePost(maleId, slot(20)).id
    }

    @Test
    fun `그날 게시물만 이른 시간부터 준다`() {
        // given

        // when
        val rows = findByDate(gender = null, cursor = null)

        // then
        assertThat(rows.map { it.getPostId() })
            .containsExactly(morningPostId, femalePostId, eveningPostId)
    }

    @Test
    fun `성별을 지정하면 해당 성별 게시물만 준다`() {
        // given
        // when
        val rows = findByDate(gender = Gender.FEMALE.name, cursor = null)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(femalePostId)
    }

    @Test
    fun `커서를 주면 그 뒤부터 준다`() {
        // given

        // when
        val rows = findByDate(gender = null, cursor = morningPostId)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(femalePostId, eveningPostId)
    }

    @Test
    fun `내가 좋아요한 게시물은 표시된다`() {
        // given
        feedPostLikeRepository.saveAndFlush(FeedPostLike(morningPostId, meId))

        // when
        val rows = findByDate(gender = null, cursor = null)

        // then
        assertThat(rows.first { it.getPostId() == morningPostId }.getLikedByMe()).isTrue()
        assertThat(rows.first { it.getPostId() == eveningPostId }.getLikedByMe()).isFalse()
    }

    @Test
    fun `차단한 회원의 게시물은 빠진다`() {
        // given
        memberBlockRepository.saveAndFlush(MemberBlock(meId, maleId))

        // when
        val rows = findByDate(gender = null, cursor = null)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(femalePostId)
    }

    @Test
    fun `신고한 게시물은 빠진다`() {
        // given
        feedPostReportRepository.saveAndFlush(FeedPostReport(meId, morningPostId))

        // when
        val rows = findByDate(gender = null, cursor = null)

        // then
        assertThat(rows.map { it.getPostId() }).doesNotContain(morningPostId)
    }

    private fun findByDate(gender: String?, cursor: Long?) = feedPostRepository.findByDate(
        memberId = meId,
        gender = gender,
        from = startOfDay(),
        to = startOfDay().plusSeconds(DAY_SECONDS),
        cursor = cursor,
        size = PAGE_SIZE,
    )

    private fun savePost(memberId: Long, slotAt: Instant) = feedPostRepository.saveAndFlush(
        FeedPost(memberId = memberId, slotAt = slotAt, objectKey = "feeds/$memberId/$slotAt.jpg"),
    )

    private fun save(member: Member) = memberRepository.saveAndFlush(member)

    private fun slot(hour: Int) = startOfDay().plusSeconds(hour * 3600L)

    private fun startOfDay() = LocalDate.of(2020, 1, 1).atStartOfDay(KOREA).toInstant()

    private fun member(phoneNumber: String, gender: Gender) = Member(
        phoneNumber = phoneNumber,
        password = "encoded-password",
        gender = gender,
        nickname = phoneNumber.takeLast(10),
        birthYear = 1998,
    )

    companion object {

        private const val PAGE_SIZE = 20
        private const val DAY_SECONDS = 86_400L

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
