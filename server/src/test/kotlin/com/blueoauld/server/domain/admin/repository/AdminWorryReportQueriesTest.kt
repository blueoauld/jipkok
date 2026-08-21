package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.worry.entity.WorryComment
import com.blueoauld.server.domain.worry.entity.WorryCommentReport
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.WorryPostReport
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import com.blueoauld.server.domain.worry.repository.WorryCommentReportRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostReportRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
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
class AdminWorryReportQueriesTest {

    @Autowired
    private lateinit var worryPostRepository: WorryPostRepository

    @Autowired
    private lateinit var worryPostReportRepository: WorryPostReportRepository

    @Autowired
    private lateinit var worryCommentRepository: WorryCommentRepository

    @Autowired
    private lateinit var worryCommentReportRepository: WorryCommentReportRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    private var activePostId = 0L

    private var deletedPostId = 0L

    private var activeCommentId = 0L

    private var deletedCommentId = 0L

    @BeforeEach
    fun setUp() {
        val activePost = savePost(authorId = 1)
        val deletedPost = savePost(authorId = 2)
        activePostId = activePost.id
        deletedPostId = deletedPost.id

        savePostReport(reporterId = 10, postId = activePostId)
        savePostReport(reporterId = 11, postId = activePostId)
        savePostReport(reporterId = 10, postId = deletedPostId)

        val activeComment = saveComment(postId = activePostId, authorId = 1)
        val deletedComment = saveComment(postId = activePostId, authorId = 2)
        activeCommentId = activeComment.id
        deletedCommentId = deletedComment.id

        saveCommentReport(reporterId = 10, commentId = activeCommentId)
        saveCommentReport(reporterId = 11, commentId = deletedCommentId)

        deletedComment.deletedByReport = true
        worryCommentRepository.saveAndFlush(deletedComment)

        worryPostRepository.delete(deletedPost)
        worryCommentRepository.delete(deletedComment)
        entityManager.flush()
        entityManager.clear()
    }

    @Test
    fun `고민 단위로 묶어 신고 수와 최근 신고 시각을 준다`() {
        // given

        // when
        val all = worryPostReportRepository.findPostsForAdmin(null, null, 20, 0)
        val active = worryPostReportRepository.findPostsForAdmin("ACTIVE", null, 20, 0)
        val deleted = worryPostReportRepository.findPostsForAdmin("DELETED", null, 20, 0)
        val byAuthor = worryPostReportRepository.findPostsForAdmin(null, 1, 20, 0)

        // then
        assertThat(all.map { it.postId }).containsExactly(deletedPostId, activePostId)
        assertThat(active.map { it.postId }).containsExactly(activePostId)
        assertThat(active.first().reportCount).isEqualTo(2)
        assertThat(active.first().content).isEqualTo("고민 내용")
        assertThat(deleted.first().postDeletedAt).isNotNull()
        assertThat(byAuthor.map { it.postId }).containsExactly(activePostId)
    }

    @Test
    fun `고민 수를 세고 신고자 목록을 준다`() {
        // given

        // when
        val count = worryPostReportRepository.countPostsForAdmin(null, null)
        val reporters = worryPostReportRepository.findReportersByPostIdIn(listOf(activePostId))

        // then
        assertThat(count).isEqualTo(2)
        assertThat(reporters.map { it.reporterId }).containsExactly(11, 10)
        assertThat(reporters.map { it.targetId }).containsOnly(activePostId)
    }

    @Test
    fun `댓글은 삭제 여부와 자동 삭제 여부를 함께 준다`() {
        // given

        // when
        val all = worryCommentReportRepository.findCommentsForAdmin(null, null, 20, 0)
        val active = worryCommentReportRepository.findCommentsForAdmin("ACTIVE", null, 20, 0)
        val deleted = worryCommentReportRepository.findCommentsForAdmin("DELETED", null, 20, 0)
        val count = worryCommentReportRepository.countCommentsForAdmin(null, null)

        // then
        assertThat(all.map { it.commentId }).containsExactlyInAnyOrder(activeCommentId, deletedCommentId)
        assertThat(active.map { it.commentId }).containsExactly(activeCommentId)
        assertThat(active.first().deletedByReport).isFalse()
        assertThat(deleted.first().commentId).isEqualTo(deletedCommentId)
        assertThat(deleted.first().deletedByReport).isTrue()
        assertThat(deleted.first().postId).isEqualTo(activePostId)
        assertThat(count).isEqualTo(2)
    }

    @Test
    fun `댓글 신고자 목록을 댓글별로 준다`() {
        // given

        // when
        val reporters = worryCommentReportRepository.findReportersByCommentIdIn(listOf(activeCommentId))

        // then
        assertThat(reporters.map { it.reporterId }).containsExactly(10)
        assertThat(reporters.map { it.targetId }).containsOnly(activeCommentId)
    }

    private fun savePost(authorId: Long) = worryPostRepository.saveAndFlush(
        WorryPost(memberId = authorId, category = WorryCategory.ETC, content = "고민 내용"),
    )

    private fun savePostReport(reporterId: Long, postId: Long) {
        worryPostReportRepository.saveAndFlush(WorryPostReport(reporterId, postId))
    }

    private fun saveComment(postId: Long, authorId: Long) = worryCommentRepository.saveAndFlush(
        WorryComment(postId = postId, memberId = authorId, content = "댓글 내용", anonymousNo = 1),
    )

    private fun saveCommentReport(reporterId: Long, commentId: Long) {
        worryCommentReportRepository.saveAndFlush(WorryCommentReport(reporterId, commentId))
    }
}
