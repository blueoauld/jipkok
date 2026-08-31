package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.entity.FeedPostReport
import com.blueoauld.server.domain.feed.repository.FeedPostReportRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
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
class AdminFeedReportQueriesTest {

    @Autowired
    private lateinit var feedPostReportRepository: FeedPostReportRepository

    @Autowired
    private lateinit var feedAdminRepository: FeedAdminRepository

    @Autowired
    private lateinit var feedPostRepository: FeedPostRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    private var activePostId = 0L

    private var deletedPostId = 0L

    @BeforeEach
    fun setUp() {
        val activePost = savePost(authorId = 1)
        val deletedPost = savePost(authorId = 2)
        activePostId = activePost.id
        deletedPostId = deletedPost.id

        saveReport(reporterId = 10, postId = activePostId)
        saveReport(reporterId = 11, postId = activePostId)
        saveReport(reporterId = 10, postId = deletedPostId)

        feedPostRepository.delete(deletedPost)
        entityManager.flush()
        entityManager.clear()
    }

    @Test
    fun `피드 단위로 묶어 신고 수와 최근 신고 시각을 준다`() {
        // given

        // when
        val all = feedAdminRepository.findPostsForAdmin(null, null, 20, 0)
        val active = feedAdminRepository.findPostsForAdmin("ACTIVE", null, 20, 0)
        val deleted = feedAdminRepository.findPostsForAdmin("DELETED", null, 20, 0)
        val byAuthor = feedAdminRepository.findPostsForAdmin(null, 1, 20, 0)

        // then
        assertThat(all.map { it.postId }).containsExactly(deletedPostId, activePostId)
        assertThat(active.map { it.postId }).containsExactly(activePostId)
        assertThat(active.first().reportCount).isEqualTo(2)
        assertThat(active.first().lastReportedAt).isNotNull()
        assertThat(deleted.first().postDeletedAt).isNotNull()
        assertThat(byAuthor.map { it.postId }).containsExactly(activePostId)
    }

    @Test
    fun `피드 수 기준으로 세고 신고자 목록을 준다`() {
        // given

        // when
        val count = feedAdminRepository.countPostsForAdmin(null, null)
        val reporters = feedAdminRepository.findReportersByPostIdIn(listOf(activePostId))

        // then
        assertThat(count).isEqualTo(2)
        assertThat(reporters.map { it.reporterId }).containsExactly(11, 10)
    }

    private fun savePost(authorId: Long) = feedPostRepository.saveAndFlush(
        FeedPost(
            memberId = authorId,
            slotAt = Instant.parse("2026-08-20T00:00:00Z"),
            objectKey = "feeds/$authorId/photo.jpg",
        ),
    )

    private fun saveReport(reporterId: Long, postId: Long) {
        feedPostReportRepository.saveAndFlush(FeedPostReport(reporterId, postId))
    }
}
