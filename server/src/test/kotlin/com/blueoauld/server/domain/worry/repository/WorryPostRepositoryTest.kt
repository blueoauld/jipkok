package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.worry.entity.WorryComment
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.WorryPostLike
import com.blueoauld.server.domain.worry.entity.WorryPostReport
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class WorryPostRepositoryTest {

    @Autowired
    private lateinit var worryPostRepository: WorryPostRepository

    @Autowired
    private lateinit var worryPostLikeRepository: WorryPostLikeRepository

    @Autowired
    private lateinit var worryPostReportRepository: WorryPostReportRepository

    @Autowired
    private lateinit var worryCommentRepository: WorryCommentRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    private var meId: Long = 0

    private var authorId: Long = 0

    private var quietPostId: Long = 0

    private var likedPostId: Long = 0

    private var talkedPostId: Long = 0

    @BeforeEach
    fun setUp() {
        meId = save(member("01088880000")).id
        authorId = save(member("01088880001")).id

        quietPostId = savePost(authorId).id
        likedPostId = savePost(authorId, likeCount = 5).id
        talkedPostId = savePost(authorId, likeCount = 2, commentCount = 7).id
    }

    @Test
    fun `최신순은 늦게 쓴 글부터 준다`() {
        // given

        // when
        val rows = worryPostRepository.findLatestFirst(meId, cursor = null, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() })
            .containsExactly(talkedPostId, likedPostId, quietPostId)
    }

    @Test
    fun `최신순 커서를 주면 그보다 오래된 글을 준다`() {
        // given

        // when
        val rows = worryPostRepository.findLatestFirst(meId, cursor = likedPostId, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(quietPostId)
    }

    @Test
    fun `공감순은 공감 많은 글부터 준다`() {
        // given

        // when
        val rows = worryPostRepository.findMostLikedFirst(
            meId,
            cursorLikeCount = null,
            cursorId = null,
            size = PAGE_SIZE,
        )

        // then
        assertThat(rows.map { it.getPostId() })
            .containsExactly(likedPostId, talkedPostId, quietPostId)
    }

    @Test
    fun `공감순 커서는 공감 수와 글 번호를 함께 따진다`() {
        // given
        val tiedPostId = savePost(authorId, likeCount = 2).id

        // when
        val rows = worryPostRepository.findMostLikedFirst(
            meId,
            cursorLikeCount = 2,
            cursorId = tiedPostId,
            size = PAGE_SIZE,
        )

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(talkedPostId, quietPostId)
    }

    @Test
    fun `댓글순은 댓글 많은 글부터 준다`() {
        // given

        // when
        val rows = worryPostRepository.findMostCommentedFirst(
            meId,
            cursorCommentCount = null,
            cursorId = null,
            size = PAGE_SIZE,
        )

        // then
        assertThat(rows.map { it.getPostId() })
            .containsExactly(talkedPostId, likedPostId, quietPostId)
    }

    @Test
    fun `내가 공감한 글은 표시된다`() {
        // given
        worryPostLikeRepository.saveAndFlush(WorryPostLike(likedPostId, meId))

        // when
        val rows = worryPostRepository.findLatestFirst(meId, cursor = null, size = PAGE_SIZE)

        // then
        assertThat(rows.first { it.getPostId() == likedPostId }.getLikedByMe()).isTrue()
        assertThat(rows.first { it.getPostId() == quietPostId }.getLikedByMe()).isFalse()
    }

    @Test
    fun `신고한 글은 빠진다`() {
        // given
        worryPostReportRepository.saveAndFlush(WorryPostReport(meId, likedPostId))

        // when
        val rows = worryPostRepository.findLatestFirst(meId, cursor = null, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() }).doesNotContain(likedPostId)
    }

    @Test
    fun `댓글 목록은 오래된 순으로 주고 지운 댓글도 상태와 함께 준다`() {
        // given
        val active = saveComment(quietPostId, meId, anonymousNo = 1)
        val deleted = saveComment(quietPostId, authorId, anonymousNo = 2)
        worryCommentRepository.delete(deleted)
        val reportDeleted = saveComment(quietPostId, authorId, anonymousNo = 2)
        reportDeleted.deletedByReport = true
        worryCommentRepository.saveAndFlush(reportDeleted)
        worryCommentRepository.delete(reportDeleted)

        // when
        val rows = findComments(cursor = null)

        // then
        assertThat(rows.map { it.getCommentId() })
            .containsExactly(active.id, deleted.id, reportDeleted.id)
        assertThat(rows.map { it.getDeleted() }).containsExactly(false, true, true)
        assertThat(rows.map { it.getDeletedByReport() }).containsExactly(false, false, true)
    }

    @Test
    fun `답글은 나중에 달려도 부모 댓글 바로 뒤에 온다`() {
        // given
        val first = saveComment(quietPostId, meId, anonymousNo = 1)
        val second = saveComment(quietPostId, authorId, anonymousNo = 2)
        val reply = saveComment(quietPostId, authorId, anonymousNo = 2, parentId = first.id)

        // when
        val rows = findComments(cursor = null)

        // then
        assertThat(rows.map { it.getCommentId() }).containsExactly(first.id, reply.id, second.id)
        assertThat(rows.map { it.getParentId() }).containsExactly(null, first.id, null)
    }

    @Test
    fun `댓글 커서는 답글까지 건너뛰고 다음 묶음을 준다`() {
        // given
        val first = saveComment(quietPostId, meId, anonymousNo = 1)
        val second = saveComment(quietPostId, authorId, anonymousNo = 2)
        val reply = saveComment(quietPostId, authorId, anonymousNo = 2, parentId = first.id)

        // when
        val rows = findComments(cursor = reply.id)

        // then
        assertThat(rows.map { it.getCommentId() }).containsExactly(second.id)
    }

    @Test
    fun `익명 번호는 지운 댓글까지 세어 겹치지 않게 한다`() {
        // given
        saveComment(quietPostId, meId, anonymousNo = 1)
        val deleted = saveComment(quietPostId, authorId, anonymousNo = 2)
        worryCommentRepository.delete(deleted)

        // when
        val maxNo = worryCommentRepository.findMaxAnonymousNo(quietPostId)
        val deletedWriterNo = worryCommentRepository.findAnonymousNo(quietPostId, authorId)

        // then
        assertThat(maxNo).isEqualTo(2)
        assertThat(deletedWriterNo).isEqualTo(2)
    }

    @Test
    fun `회원의 글을 한꺼번에 지우면 소프트 삭제된다`() {
        // given

        // when
        worryPostRepository.deleteAllByMemberId(authorId)

        // then
        assertThat(worryPostRepository.findById(quietPostId)).isEmpty()
        assertThat(countDeletedRows(quietPostId)).isOne()
    }

    @Test
    fun `회원이 단 댓글만큼 글의 댓글 수를 내린다`() {
        // given
        saveComment(talkedPostId, meId, anonymousNo = 1)
        saveComment(talkedPostId, meId, anonymousNo = 1)

        // when
        worryPostRepository.decreaseCommentCountCommentedBy(meId)

        // then
        entityManager.clear()
        assertThat(worryPostRepository.findById(talkedPostId).orElseThrow().commentCount).isEqualTo(5)
    }

    private fun countDeletedRows(postId: Long) = entityManager
        .createNativeQuery("select count(*) from worry_post where id = :id and deleted_at is not null")
        .setParameter("id", postId)
        .singleResult as Long

    private fun savePost(memberId: Long, likeCount: Int = 0, commentCount: Int = 0) =
        worryPostRepository.saveAndFlush(
            WorryPost(
                memberId = memberId,
                content = "고민 내용",
                likeCount = likeCount,
                commentCount = commentCount,
            ),
        )

    private fun findComments(cursor: Long?) = worryCommentRepository.findByPostIdOldestFirst(
        postId = quietPostId,
        cursorThreadId = cursor?.let { worryCommentRepository.findThreadId(it) },
        cursorId = cursor,
        size = PAGE_SIZE,
    )

    private fun saveComment(postId: Long, memberId: Long, anonymousNo: Int, parentId: Long? = null) =
        worryCommentRepository.saveAndFlush(
            WorryComment(
                postId = postId,
                memberId = memberId,
                content = "댓글 내용",
                anonymousNo = anonymousNo,
                parentId = parentId,
            ),
        )

    private fun save(member: Member) = memberRepository.saveAndFlush(member)

    private fun member(phoneNumber: String) = Member(
        phoneNumber = phoneNumber,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = phoneNumber.takeLast(10),
        birthYear = 1998,
    )

    companion object {

        private const val PAGE_SIZE = 20
    }
}
