package com.blueoauld.server.domain.feed.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.block.entity.MemberBlock
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.entity.FeedPostLike
import com.blueoauld.server.domain.feed.entity.FeedPostReport
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.time.KOREA
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate

@Import(TestcontainersConfiguration::class)
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

    @Autowired
    private lateinit var contactBlockRepository: ContactBlockRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    private var meId: Long = 0

    private var maleId: Long = 0

    private var femaleId: Long = 0

    private var morningPostId: Long = 0

    private var eveningPostId: Long = 0

    private var femalePostId: Long = 0

    @BeforeEach
    fun setUp() {
        meId = save(member("+821088880000", Gender.MALE)).id
        maleId = save(member(MALE_PHONE_NUMBER, Gender.MALE)).id
        femaleId = save(member("+821088880002", Gender.FEMALE)).id

        savePost(maleId, slot(9).minusSeconds(DAY_SECONDS))
        morningPostId = savePost(maleId, slot(9)).id
        femalePostId = savePost(femaleId, slot(12)).id
        eveningPostId = savePost(maleId, slot(20)).id
    }

    @Test
    fun `과거 정렬은 그날 게시물만 이른 시간부터 준다`() {
        // given

        // when
        val rows = findByDate(gender = null, cursor = null)

        // then
        assertThat(rows.map { it.getPostId() })
            .containsExactly(morningPostId, femalePostId, eveningPostId)
    }

    @Test
    fun `최신 정렬은 그날 게시물만 늦은 시간부터 준다`() {
        // given

        // when
        val rows = findByDateLatest(gender = null, cursor = null)

        // then
        assertThat(rows.map { it.getPostId() })
            .containsExactly(eveningPostId, femalePostId, morningPostId)
    }

    @Test
    fun `정렬은 저장 순서가 아니라 슬롯 시간을 따른다`() {
        // given
        val late = savePost(femaleId, slot(22)).id
        val early = savePost(meId, slot(7)).id

        // when
        val rows = findByDateLatest(gender = null, cursor = null)

        // then
        assertThat(rows.map { it.getPostId() }).startsWith(late)
        assertThat(rows.map { it.getPostId() }).endsWith(early)
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
    fun `최신 정렬에서 커서를 주면 그보다 이른 게시물을 준다`() {
        // given

        // when
        val rows = findByDateLatest(gender = null, cursor = eveningPostId)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(femalePostId, morningPostId)
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
    fun `내 주소록에 있는 번호의 회원 게시물은 빠진다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(meId, MALE_PHONE_NUMBER))

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

    @Test
    fun `회원의 게시물을 한꺼번에 지우면 소프트 삭제된다`() {
        // given
        val post = savePost(meId, slot(1))

        // when
        feedPostRepository.deleteAllByMemberId(meId)

        // then
        assertThat(feedPostRepository.findById(post.id)).isEmpty()
        assertThat(countRows(post.id)).isOne()
    }

    @Test
    fun `회원이 좋아요한 게시물만 좋아요 수를 하나씩 내리고 0 아래로는 내리지 않는다`() {
        // given
        val liked = savePost(maleId, slot(1), likeCount = 3)
        val likedByOther = savePost(maleId, slot(2), likeCount = 1)
        val alreadyZero = savePost(maleId, slot(3))
        feedPostLikeRepository.saveAllAndFlush(
            listOf(
                FeedPostLike(liked.id, meId),
                FeedPostLike(likedByOther.id, femaleId),
                FeedPostLike(alreadyZero.id, meId),
            ),
        )

        // when
        feedPostRepository.decreaseLikeCountLikedBy(meId)

        // then
        assertThat(feedPostRepository.findById(liked.id).orElseThrow().likeCount).isEqualTo(2)
        assertThat(feedPostRepository.findById(likedByOther.id).orElseThrow().likeCount).isOne()
        assertThat(feedPostRepository.findById(alreadyZero.id).orElseThrow().likeCount).isZero()
    }

    @Test
    fun `사진 키는 지운 글까지 준다`() {
        // given
        val post = savePost(meId, slot(1))
        val deleted = savePost(meId, slot(2))
        feedPostRepository.delete(deleted)

        // when
        val keys = feedPostRepository.findObjectKeysByIdIn(listOf(post.id, deleted.id))

        // then
        assertThat(keys).containsExactlyInAnyOrder(post.objectKey, deleted.objectKey)
    }

    private fun countRows(postId: Long) = entityManager
        .createNativeQuery("select count(*) from feed_post where id = :id and deleted_at is not null")
        .setParameter("id", postId)
        .singleResult as Long

    private fun findByDate(gender: String?, cursor: Long?) = feedPostRepository.findByDateOldestFirst(
        memberId = meId,
        gender = gender,
        from = startOfDay(),
        to = startOfDay().plusSeconds(DAY_SECONDS),
        cursor = cursor,
        size = PAGE_SIZE,
    )

    private fun findByDateLatest(gender: String?, cursor: Long?) = feedPostRepository.findByDateLatestFirst(
        memberId = meId,
        gender = gender,
        from = startOfDay(),
        to = startOfDay().plusSeconds(DAY_SECONDS),
        cursor = cursor,
        size = PAGE_SIZE,
    )

    private fun savePost(memberId: Long, slotAt: Instant, likeCount: Int = 0) = feedPostRepository.saveAndFlush(
        FeedPost(
            memberId = memberId,
            slotAt = slotAt,
            objectKey = "feeds/$memberId/$slotAt.jpg",
            likeCount = likeCount,
        ),
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
        private const val MALE_PHONE_NUMBER = "+821088880001"
        private const val DAY_SECONDS = 86_400L
    }
}
