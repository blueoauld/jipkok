package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminWorryCommentRow
import com.blueoauld.server.domain.admin.dto.AdminWorryPostRow
import com.blueoauld.server.domain.admin.dto.AdminWorryReporterRow
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.worry.entity.WorryComment
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import com.blueoauld.server.domain.worry.repository.WorryCommentReportRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostReportRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

class AdminWorryServiceTest {

    private val worryPostReportRepository = mockk<WorryPostReportRepository>()

    private val worryCommentReportRepository = mockk<WorryCommentReportRepository>()

    private val worryPostRepository = mockk<WorryPostRepository>(relaxed = true)

    private val worryCommentRepository = mockk<WorryCommentRepository>()

    private val memberAdminService = mockk<MemberAdminService>()

    private val adminActionRecorder = mockk<AdminActionRecorder>(relaxed = true)

    private val adminWorryService = AdminWorryService(
        worryPostReportRepository,
        worryCommentReportRepository,
        worryPostRepository,
        worryCommentRepository,
        memberAdminService,
        adminActionRecorder,
    )

    @Test
    fun `고민 목록은 신고자와 닉네임을 채우고 내용을 그대로 준다`() {
        // given
        every { worryPostReportRepository.findPostsForAdmin(null, null, 20, 0) } returns listOf(postRow())
        every { worryPostReportRepository.countPostsForAdmin(null, null) } returns 1
        every { worryPostReportRepository.findReportersByPostIdIn(listOf(POST_ID)) } returns listOf(
            reporterRow(POST_ID, 11),
            reporterRow(POST_ID, 10),
        )
        every { memberAdminService.findNicknames(listOf(AUTHOR_ID, 11L, 10L)) } returns
            mapOf(AUTHOR_ID to "알 수 없음", 11L to "알 수 없음", 10L to "밤산책")

        // when
        val response = adminWorryService.findPostReports(null, null, 1, 20)

        // then
        val item = response.items.first()
        assertThat(response.totalCount).isEqualTo(1)
        assertThat(item.content).isEqualTo("이직 고민")
        assertThat(item.authorNickname).isEqualTo("알 수 없음")
        assertThat(item.reportCount).isEqualTo(2)
        assertThat(item.reporters.map { it.nickname }).containsExactly("알 수 없음", "밤산책")
    }

    @Test
    fun `댓글 목록은 자동 삭제 여부를 함께 준다`() {
        // given
        every { worryCommentReportRepository.findCommentsForAdmin("DELETED", null, 20, 0) } returns listOf(commentRow())
        every { worryCommentReportRepository.countCommentsForAdmin("DELETED", null) } returns 1
        every { worryCommentReportRepository.findReportersByCommentIdIn(listOf(COMMENT_ID)) } returns listOf(
            reporterRow(COMMENT_ID, 10),
        )
        every { memberAdminService.findNicknames(listOf(AUTHOR_ID, 10L)) } returns
            mapOf(AUTHOR_ID to "익명이", 10L to "알 수 없음")

        // when
        val response = adminWorryService.findCommentReports(
            com.blueoauld.server.domain.admin.dto.AdminWorryStatus.DELETED,
            null,
            1,
            20,
        )

        // then
        val item = response.items.first()
        assertThat(item.deletedByReport).isTrue()
        assertThat(item.commentDeletedAt).isNotNull()
        assertThat(item.postId).isEqualTo(POST_ID)
        assertThat(item.authorNickname).isEqualTo("익명이")
    }

    @Test
    fun `고민 삭제는 소프트 삭제로 위임한다`() {
        // given
        val post = WorryPost(memberId = AUTHOR_ID, category = WorryCategory.WORK, content = "이직 고민")
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post)
        justRun { worryPostRepository.delete(post) }

        // when
        adminWorryService.deletePost(ACTOR_ID, POST_ID)

        // then
        verify { worryPostRepository.delete(post) }
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.DELETE_WORRY_POST, POST_ID) }
    }

    @Test
    fun `댓글 삭제는 글의 댓글 수도 줄인다`() {
        // given
        val comment = WorryComment(
            postId = POST_ID,
            memberId = AUTHOR_ID,
            content = "댓글 내용",
            anonymousNo = 1,
        )
        every { worryCommentRepository.findById(COMMENT_ID) } returns Optional.of(comment)
        justRun { worryCommentRepository.delete(comment) }

        // when
        adminWorryService.deleteComment(ACTOR_ID, COMMENT_ID)

        // then
        verify { worryCommentRepository.delete(comment) }
        verify { worryPostRepository.decreaseCommentCount(POST_ID) }
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.DELETE_WORRY_COMMENT, COMMENT_ID) }
    }

    @Test
    fun `없거나 이미 삭제된 고민이면 예외를 던진다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.empty()

        // when
        // then
        assertThatThrownBy { adminWorryService.deletePost(ACTOR_ID, POST_ID) }
            .isInstanceOf(BusinessException::class.java)
            .extracting { (it as BusinessException).errorCode }
            .isEqualTo(ErrorCode.WORRY_POST_NOT_FOUND)
    }

    @Test
    fun `없거나 이미 삭제된 댓글이면 예외를 던진다`() {
        // given
        every { worryCommentRepository.findById(COMMENT_ID) } returns Optional.empty()

        // when
        // then
        assertThatThrownBy { adminWorryService.deleteComment(ACTOR_ID, COMMENT_ID) }
            .isInstanceOf(BusinessException::class.java)
            .extracting { (it as BusinessException).errorCode }
            .isEqualTo(ErrorCode.WORRY_COMMENT_NOT_FOUND)
    }

    private fun postRow() = object : AdminWorryPostRow {
        override val postId = POST_ID
        override val authorId = AUTHOR_ID
        override val content = "이직 고민"
        override val reportCount = 2L
        override val postDeletedAt = null
        override val lastReportedAt: Instant = NOW
    }

    private fun commentRow() = object : AdminWorryCommentRow {
        override val commentId = COMMENT_ID
        override val postId = POST_ID
        override val authorId = AUTHOR_ID
        override val content = "댓글 내용"
        override val reportCount = 5L
        override val commentDeletedAt: Instant = NOW
        override val deletedByReport = true
        override val lastReportedAt: Instant = NOW
    }

    private fun reporterRow(targetId: Long, reporterId: Long) = object : AdminWorryReporterRow {
        override val targetId = targetId
        override val reporterId = reporterId
        override val createdAt: Instant = NOW
    }

    companion object {

        private const val POST_ID = 9900L
        private const val COMMENT_ID = 5500L
        private const val AUTHOR_ID = 1L
        private const val ACTOR_ID = 7L

        private val NOW: Instant = Instant.parse("2026-08-20T06:00:00Z")
    }
}
