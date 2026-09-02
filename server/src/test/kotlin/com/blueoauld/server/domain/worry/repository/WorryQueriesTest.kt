package com.blueoauld.server.domain.worry.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.worry.entity.WorryComment
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.WorryPostLike
import com.blueoauld.server.domain.worry.entity.WorryPostReport
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
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

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class WorryQueriesTest {

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
        meId = save(member("+821088880000")).id
        authorId = save(member("+821088880001")).id

        quietPostId = savePost(authorId).id
        likedPostId = savePost(authorId, likeCount = 5).id
        talkedPostId = savePost(authorId, likeCount = 2, commentCount = 7).id
    }

    @Test
    fun `최신순은 늦게 쓴 글부터 준다`() {
        // given

        // when
        val rows = worryPostRepository.findLatestFirst(meId, category = null, cursor = null, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() })
            .containsExactly(talkedPostId, likedPostId, quietPostId)
    }

    @Test
    fun `최신순 커서를 주면 그보다 오래된 글을 준다`() {
        // given

        // when
        val rows = worryPostRepository.findLatestFirst(meId, category = null, cursor = likedPostId, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(quietPostId)
    }

    @Test
    fun `공감순은 공감 많은 글부터 준다`() {
        // given

        // when
        val rows = worryPostRepository.findMostLikedFirst(
            meId,
            category = null,
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
            category = null,
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
            category = null,
            cursorCommentCount = null,
            cursorId = null,
            size = PAGE_SIZE,
        )

        // then
        assertThat(rows.map { it.getPostId() })
            .containsExactly(talkedPostId, likedPostId, quietPostId)
    }

    @Test
    fun `분류를 주면 그 분류의 글만 준다`() {
        // given
        val lovePostId = savePost(authorId, category = WorryCategory.LOVE).id
        savePost(authorId, category = WorryCategory.FAMILY)

        // when
        val rows = worryPostRepository.findLatestFirst(
            meId,
            category = WorryCategory.LOVE.name,
            cursor = null,
            size = PAGE_SIZE,
        )

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(lovePostId)
        assertThat(rows.single().getCategory()).isEqualTo(WorryCategory.LOVE.name)
    }

    @Test
    fun `공감순도 분류를 따른다`() {
        // given
        savePost(authorId, likeCount = 9, category = WorryCategory.FAMILY)
        val lovePostId = savePost(authorId, likeCount = 1, category = WorryCategory.LOVE).id

        // when
        val rows = worryPostRepository.findMostLikedFirst(
            meId,
            category = WorryCategory.LOVE.name,
            cursorLikeCount = null,
            cursorId = null,
            size = PAGE_SIZE,
        )

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(lovePostId)
    }

    @Test
    fun `내 고민 목록은 내가 쓴 글만 최신순으로 준다`() {
        // given
        val older = savePost(meId).id
        val newer = savePost(meId).id
        val deleted = savePost(meId)
        worryPostRepository.delete(deleted)

        // when
        val rows = worryPostRepository.findMineLatestFirst(meId, cursor = null, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(newer, older)
    }

    @Test
    fun `내 고민 목록도 커서를 따른다`() {
        // given
        val older = savePost(meId).id
        val newer = savePost(meId).id

        // when
        val rows = worryPostRepository.findMineLatestFirst(meId, cursor = newer, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(older)
    }

    @Test
    fun `검색은 내용 일부로 찾고 대소문자를 가리지 않는다`() {
        // given
        val postId = savePost(authorId, content = "Ohio 이직 고민").id

        // when
        val rows = worryPostRepository.search(meId, "%ohio%", cursor = null, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(postId)
    }

    @Test
    fun `검색은 신고했거나 지운 글을 뺀다`() {
        // given
        val reported = savePost(authorId, content = "이직 고민").id
        val deleted = savePost(authorId, content = "이직 고민")
        val visible = savePost(authorId, content = "이직 고민").id
        worryPostReportRepository.saveAndFlush(WorryPostReport(meId, reported))
        worryPostRepository.delete(deleted)

        // when
        val rows = worryPostRepository.search(meId, "%이직%", cursor = null, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(visible)
    }

    @Test
    fun `검색 커서를 주면 그보다 오래된 글을 준다`() {
        // given
        val older = savePost(authorId, content = "이직 고민").id
        val newer = savePost(authorId, content = "이직 고민").id

        // when
        val rows = worryPostRepository.search(meId, "%이직%", cursor = newer, size = PAGE_SIZE)

        // then
        assertThat(rows.map { it.getPostId() }).containsExactly(older)
    }

    @Test
    fun `내가 공감한 글은 표시된다`() {
        // given
        worryPostLikeRepository.saveAndFlush(WorryPostLike(likedPostId, meId))

        // when
        val rows = worryPostRepository.findLatestFirst(meId, category = null, cursor = null, size = PAGE_SIZE)

        // then
        assertThat(rows.first { it.getPostId() == likedPostId }.getLikedByMe()).isTrue()
        assertThat(rows.first { it.getPostId() == quietPostId }.getLikedByMe()).isFalse()
    }

    @Test
    fun `신고한 글은 빠진다`() {
        // given
        worryPostReportRepository.saveAndFlush(WorryPostReport(meId, likedPostId))

        // when
        val rows = worryPostRepository.findLatestFirst(meId, category = null, cursor = null, size = PAGE_SIZE)

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
    fun `답글이 남은 댓글은 보관 기간이 지나도 정리 대상이 아니다`() {
        // given
        val parent = saveComment(quietPostId, authorId, anonymousNo = 1)
        val lonely = saveComment(quietPostId, meId, anonymousNo = 2)
        saveComment(quietPostId, meId, anonymousNo = 2, parentId = parent.id)
        worryCommentRepository.delete(parent)
        worryCommentRepository.delete(lonely)

        // when
        val ids = worryCommentRepository.findIdsDeletedBeforeWithoutReplies(FAR_FUTURE)

        // then
        assertThat(ids).containsExactly(lonely.id)
    }

    @Test
    fun `답글이 사라지면 부모 댓글도 정리 대상이 된다`() {
        // given
        val parent = saveComment(quietPostId, authorId, anonymousNo = 1)
        val reply = saveComment(quietPostId, meId, anonymousNo = 2, parentId = parent.id)
        worryCommentRepository.delete(parent)
        worryCommentRepository.deleteAllByIdIn(listOf(reply.id))

        // when
        val ids = worryCommentRepository.findIdsDeletedBeforeWithoutReplies(FAR_FUTURE)

        // then
        assertThat(ids).containsExactly(parent.id)
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

    @Test
    fun `하루 작성 수는 지운 글까지 센다`() {
        // given
        val deleted = savePost(meId)
        worryPostRepository.delete(deleted)
        savePost(meId)

        // when
        val count = worryPostRepository.countByMemberIdBetween(meId, DISTANT_PAST, FAR_FUTURE)

        // then
        assertThat(count).isEqualTo(2)
    }

    @Test
    fun `하루 작성 수는 범위 밖의 글을 빼고 다른 사람 글도 뺀다`() {
        // given
        savePost(meId)
        savePost(authorId)

        // when
        val outside = worryPostRepository.countByMemberIdBetween(meId, FAR_FUTURE, FAR_FUTURE)

        // then
        assertThat(outside).isZero()
    }

    @Test
    fun `커서용 공감 수와 댓글 수를 읽는다`() {
        // given

        // when
        val likeCount = worryPostRepository.findLikeCountById(talkedPostId)
        val commentCount = worryPostRepository.findCommentCountById(talkedPostId)

        // then
        assertThat(likeCount).isEqualTo(2)
        assertThat(commentCount).isEqualTo(7)
    }

    @Test
    fun `커서용 수는 지운 글도 읽어 페이지가 이어진다`() {
        // given
        worryPostRepository.delete(worryPostRepository.findById(likedPostId).orElseThrow())

        // when
        val likeCount = worryPostRepository.findLikeCountById(likedPostId)

        // then
        assertThat(likeCount).isEqualTo(5)
    }

    @Test
    fun `없는 글의 커서용 수는 없다`() {
        // given

        // when
        val likeCount = worryPostRepository.findLikeCountById(MISSING_POST_ID)

        // then
        assertThat(likeCount).isNull()
    }

    @Test
    fun `글에 달린 댓글 번호는 지운 댓글까지 준다`() {
        // given
        val comment = saveComment(quietPostId, meId, anonymousNo = 1)
        val deleted = saveComment(quietPostId, authorId, anonymousNo = 2)
        worryCommentRepository.delete(deleted)

        // when
        val ids = worryCommentRepository.findIdsByPostIdIn(listOf(quietPostId))

        // then
        assertThat(ids).containsExactlyInAnyOrder(comment.id, deleted.id)
    }

    private fun countDeletedRows(postId: Long) = entityManager
        .createNativeQuery("select count(*) from worry_post where id = :id and deleted_at is not null")
        .setParameter("id", postId)
        .singleResult as Long

    private fun savePost(
        memberId: Long,
        likeCount: Int = 0,
        commentCount: Int = 0,
        content: String = "고민 내용",
        category: WorryCategory = WorryCategory.ETC,
    ) = worryPostRepository.saveAndFlush(
        WorryPost(
            memberId = memberId,
            category = category,
            content = content,
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

        private const val MISSING_POST_ID = -1L

        private val DISTANT_PAST: Instant = Instant.parse("2000-01-01T00:00:00Z")

        private val FAR_FUTURE: Instant = Instant.parse("2100-01-01T00:00:00Z")
    }
}
