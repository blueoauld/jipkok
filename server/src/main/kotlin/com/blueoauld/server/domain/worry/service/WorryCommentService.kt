package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.dto.projection.WorryCommentRow
import com.blueoauld.server.domain.worry.dto.request.CreateWorryCommentRequest
import com.blueoauld.server.domain.worry.dto.response.WorryCommentResponse
import com.blueoauld.server.domain.worry.entity.WorryComment
import com.blueoauld.server.domain.worry.entity.type.WorryCommentStatus
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorryCommentService(

    private val worryCommentRepository: WorryCommentRepository,
    private val worryPostRepository: WorryPostRepository,
) {

    @Transactional(readOnly = true)
    fun find(memberId: Long, postId: Long, cursor: Long?, size: Int): CursorResponse<WorryCommentResponse> {
        val post = worryPostRepository.findById(postId).orElseThrow {
            BusinessException(ErrorCode.WORRY_POST_NOT_FOUND)
        }

        val pageSize = CursorResponse.pageSize(size)
        val cursorThreadId = cursor?.let {
            worryCommentRepository.findThreadId(it) ?: return CursorResponse(emptyList(), null)
        }
        val rows = worryCommentRepository.findByPostIdOldestFirst(postId, cursorThreadId, cursor, pageSize)

        return CursorResponse(
            items = rows.map { row ->
                WorryCommentResponse(
                    commentId = row.getCommentId(),
                    content = row.getContent().takeUnless { row.getDeleted() },
                    createdAt = row.getCreatedAt(),
                    anonymousNo = row.getAnonymousNo(),
                    parentId = row.getParentId(),
                    byAuthor = row.getMemberId() == post.memberId,
                    mine = row.getMemberId() == memberId,
                    status = statusOf(row),
                )
            },
            nextCursor = rows.lastOrNull()?.getCommentId().takeIf { rows.size == pageSize },
        )
    }

    @Transactional
    fun create(memberId: Long, postId: Long, request: CreateWorryCommentRequest) {
        worryPostRepository.findLockedById(postId)
            ?: throw BusinessException(ErrorCode.WORRY_POST_NOT_FOUND)

        request.parentId?.let { validateParent(postId, it) }

        val anonymousNo = worryCommentRepository.findAnonymousNo(postId, memberId)
            ?: ((worryCommentRepository.findMaxAnonymousNo(postId) ?: 0) + 1)

        worryCommentRepository.saveAndFlush(
            WorryComment(
                postId = postId,
                memberId = memberId,
                content = request.content,
                anonymousNo = anonymousNo,
                parentId = request.parentId,
            ),
        )
        worryPostRepository.increaseCommentCount(postId)
    }

    @Transactional
    fun delete(memberId: Long, commentId: Long) {
        val comment = worryCommentRepository.findById(commentId).orElseThrow {
            BusinessException(ErrorCode.WORRY_COMMENT_NOT_FOUND)
        }

        if (comment.memberId != memberId) {
            throw BusinessException(ErrorCode.NOT_WORRY_COMMENT_AUTHOR)
        }

        worryCommentRepository.delete(comment)
        worryPostRepository.decreaseCommentCount(comment.postId)
    }

    private fun validateParent(postId: Long, parentId: Long) {
        val parent = worryCommentRepository.findById(parentId).orElseThrow {
            BusinessException(ErrorCode.WORRY_COMMENT_NOT_FOUND)
        }

        if (parent.postId != postId) {
            throw BusinessException(ErrorCode.WORRY_COMMENT_NOT_FOUND)
        }

        if (parent.parentId != null) {
            throw BusinessException(ErrorCode.NESTED_WORRY_REPLY)
        }
    }

    private fun statusOf(row: WorryCommentRow) = when {
        row.getDeletedByReport() -> WorryCommentStatus.REPORT_DELETED
        row.getDeleted() -> WorryCommentStatus.DELETED
        else -> WorryCommentStatus.ACTIVE
    }
}
