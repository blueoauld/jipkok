package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.dto.projection.WorryCommentRow
import com.blueoauld.server.domain.worry.dto.request.CreateWorryCommentRequest
import com.blueoauld.server.domain.worry.entity.WorryComment
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import com.blueoauld.server.domain.worry.entity.type.WorryCommentStatus
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

class WorryCommentServiceTest {

    private val worryCommentRepository = mockk<WorryCommentRepository>(relaxed = true)

    private val worryPostRepository = mockk<WorryPostRepository>(relaxed = true)

    private val worryCommentService = WorryCommentService(worryCommentRepository, worryPostRepository)

    @BeforeEach
    fun setUp() {
        every { worryPostRepository.findLockedById(POST_ID) } returns post(AUTHOR_ID)
        every { worryCommentRepository.findAnonymousNo(any(), any()) } returns null
        every { worryCommentRepository.findMaxAnonymousNo(POST_ID) } returns null
        every { worryCommentRepository.saveAndFlush(any()) } answers { firstArg() }
    }

    @Test
    fun `첫 댓글은 익명 1번을 받는다`() {
        // given
        val saved = slot<WorryComment>()

        // when
        worryCommentService.create(MEMBER_ID, POST_ID, CreateWorryCommentRequest("힘내세요"))

        // then
        verify { worryCommentRepository.saveAndFlush(capture(saved)) }
        verify { worryPostRepository.increaseCommentCount(POST_ID) }
        assertThat(saved.captured.anonymousNo).isEqualTo(1)
        assertThat(saved.captured.content).isEqualTo("힘내세요")
    }

    @Test
    fun `새 사람이 댓글을 달면 다음 번호를 받는다`() {
        // given
        every { worryCommentRepository.findMaxAnonymousNo(POST_ID) } returns 3
        val saved = slot<WorryComment>()

        // when
        worryCommentService.create(MEMBER_ID, POST_ID, CreateWorryCommentRequest("힘내세요"))

        // then
        verify { worryCommentRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.anonymousNo).isEqualTo(4)
    }

    @Test
    fun `같은 사람이 다시 달면 쓰던 번호를 유지한다`() {
        // given
        every { worryCommentRepository.findAnonymousNo(POST_ID, MEMBER_ID) } returns 2
        val saved = slot<WorryComment>()

        // when
        worryCommentService.create(MEMBER_ID, POST_ID, CreateWorryCommentRequest("한 번 더"))

        // then
        verify { worryCommentRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.anonymousNo).isEqualTo(2)
    }

    @Test
    fun `없는 글에는 댓글을 달 수 없다`() {
        // given
        every { worryPostRepository.findLockedById(POST_ID) } returns null

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentService.create(MEMBER_ID, POST_ID, CreateWorryCommentRequest("힘내세요"))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_POST_NOT_FOUND)
        verify(exactly = 0) { worryCommentRepository.saveAndFlush(any()) }
    }

    @Test
    fun `답글은 부모 댓글을 달고 저장된다`() {
        // given
        every { worryCommentRepository.findById(PARENT_ID) } returns Optional.of(comment(OTHER_MEMBER_ID, 1))
        val saved = slot<WorryComment>()

        // when
        worryCommentService.create(MEMBER_ID, POST_ID, CreateWorryCommentRequest("저도요", PARENT_ID))

        // then
        verify { worryCommentRepository.saveAndFlush(capture(saved)) }
        verify { worryPostRepository.increaseCommentCount(POST_ID) }
        assertThat(saved.captured.parentId).isEqualTo(PARENT_ID)
    }

    @Test
    fun `답글에는 답글을 달 수 없다`() {
        // given
        every {
            worryCommentRepository.findById(PARENT_ID)
        } returns Optional.of(comment(OTHER_MEMBER_ID, 1, parentId = 1L))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentService.create(MEMBER_ID, POST_ID, CreateWorryCommentRequest("저도요", PARENT_ID))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.NESTED_WORRY_REPLY)
        verify(exactly = 0) { worryCommentRepository.saveAndFlush(any()) }
    }

    @Test
    fun `다른 글의 댓글에는 답글을 달 수 없다`() {
        // given
        every {
            worryCommentRepository.findById(PARENT_ID)
        } returns Optional.of(comment(OTHER_MEMBER_ID, 1, postId = OTHER_POST_ID))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentService.create(MEMBER_ID, POST_ID, CreateWorryCommentRequest("저도요", PARENT_ID))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_COMMENT_NOT_FOUND)
        verify(exactly = 0) { worryCommentRepository.saveAndFlush(any()) }
    }

    @Test
    fun `커서 댓글이 사라졌으면 빈 페이지를 준다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post(AUTHOR_ID))
        every { worryCommentRepository.findThreadId(COMMENT_ID) } returns null

        // when
        val response = worryCommentService.find(MEMBER_ID, POST_ID, COMMENT_ID, 20)

        // then
        assertThat(response.items).isEmpty()
        assertThat(response.nextCursor).isNull()
        verify(exactly = 0) { worryCommentRepository.findByPostIdOldestFirst(any(), any(), any(), any()) }
    }

    @Test
    fun `본인 댓글을 지우면 글의 댓글 수가 줄어든다`() {
        // given
        val comment = comment(MEMBER_ID, anonymousNo = 1)
        every { worryCommentRepository.findById(COMMENT_ID) } returns Optional.of(comment)

        // when
        worryCommentService.delete(MEMBER_ID, COMMENT_ID)

        // then
        verify { worryCommentRepository.delete(comment) }
        verify { worryPostRepository.decreaseCommentCount(POST_ID) }
    }

    @Test
    fun `남의 댓글은 지울 수 없다`() {
        // given
        every { worryCommentRepository.findById(COMMENT_ID) } returns
            Optional.of(comment(OTHER_MEMBER_ID, anonymousNo = 1))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentService.delete(MEMBER_ID, COMMENT_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.NOT_WORRY_COMMENT_AUTHOR)
        verify(exactly = 0) { worryCommentRepository.delete(any()) }
    }

    @Test
    fun `없는 댓글을 지우면 실패한다`() {
        // given
        every { worryCommentRepository.findById(COMMENT_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentService.delete(MEMBER_ID, COMMENT_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_COMMENT_NOT_FOUND)
    }

    @Test
    fun `지운 댓글은 내용 없이 상태만 준다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post(AUTHOR_ID))
        every {
            worryCommentRepository.findByPostIdOldestFirst(POST_ID, null, null, 20)
        } returns listOf(
            row(commentId = 1),
            row(commentId = 2, deleted = true),
            row(commentId = 3, deleted = true, deletedByReport = true),
        )

        // when
        val response = worryCommentService.find(MEMBER_ID, POST_ID, null, 20)

        // then
        assertThat(response.items.map { it.status }).containsExactly(
            WorryCommentStatus.ACTIVE,
            WorryCommentStatus.DELETED,
            WorryCommentStatus.REPORT_DELETED,
        )
        assertThat(response.items.map { it.content }).containsExactly("댓글 내용", null, null)
    }

    @Test
    fun `없는 글의 댓글 목록을 보면 실패한다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryCommentService.find(MEMBER_ID, POST_ID, null, 20)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_POST_NOT_FOUND)
    }

    private fun post(memberId: Long) =
        WorryPost(memberId = memberId, category = WorryCategory.ETC, content = "고민 내용")

    private fun comment(
        memberId: Long,
        anonymousNo: Int,
        postId: Long = POST_ID,
        parentId: Long? = null,
    ) = WorryComment(
        postId = postId,
        memberId = memberId,
        content = "댓글 내용",
        anonymousNo = anonymousNo,
        parentId = parentId,
    )

    private fun row(
        commentId: Long,
        parentId: Long? = null,
        deleted: Boolean = false,
        deletedByReport: Boolean = false,
    ) = object : WorryCommentRow {

        override fun getCommentId() = commentId

        override fun getMemberId() = MEMBER_ID

        override fun getContent() = "댓글 내용"

        override fun getCreatedAt(): Instant = Instant.parse("2026-08-01T00:00:00Z")

        override fun getAnonymousNo() = 1

        override fun getParentId() = parentId

        override fun getDeleted() = deleted

        override fun getDeletedByReport() = deletedByReport
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val OTHER_MEMBER_ID = 2L
        private const val AUTHOR_ID = 3L
        private const val POST_ID = 10L
        private const val OTHER_POST_ID = 11L
        private const val COMMENT_ID = 100L
        private const val PARENT_ID = 101L
    }
}
