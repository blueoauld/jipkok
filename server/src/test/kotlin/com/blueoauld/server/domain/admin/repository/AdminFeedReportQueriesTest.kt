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
    fun `게시 상태와 작성자로 거르고 신고 수를 센다`() {
        // given

        // when
        val all = feedPostReportRepository.findAllForAdmin(null, null, 20, 0)
        val active = feedPostReportRepository.findAllForAdmin("ACTIVE", null, 20, 0)
        val deleted = feedPostReportRepository.findAllForAdmin("DELETED", null, 20, 0)
        val byAuthor = feedPostReportRepository.findAllForAdmin(null, 1, 20, 0)

        // then
        assertThat(all).hasSize(3)
        assertThat(all.map { it.id }).isSortedAccordingTo { a, b -> b.compareTo(a) }
        assertThat(active.map { it.postId }).containsOnly(activePostId)
        assertThat(active.first().postReportCount).isEqualTo(2)
        assertThat(deleted.map { it.postId }).containsOnly(deletedPostId)
        assertThat(deleted.first().postDeletedAt).isNotNull()
        assertThat(byAuthor).hasSize(2)
    }

    @Test
    fun `페이지 크기와 오프셋, 개수를 적용한다`() {
        // given

        // when
        val firstPage = feedPostReportRepository.findAllForAdmin(null, null, 2, 0)
        val secondPage = feedPostReportRepository.findAllForAdmin(null, null, 2, 2)
        val count = feedPostReportRepository.countForAdmin("ACTIVE", null)

        // then
        assertThat(firstPage).hasSize(2)
        assertThat(secondPage).hasSize(1)
        assertThat(count).isEqualTo(2)
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
