package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminWorryStatus
import com.blueoauld.server.domain.admin.dto.response.AdminWorryCommentReportPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminWorryCommentReportResponse
import com.blueoauld.server.domain.admin.dto.response.AdminWorryPostReportPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminWorryPostReportResponse
import com.blueoauld.server.domain.admin.dto.response.AdminWorryReporterResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentReportRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostReportRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class AdminWorryService(

    private val worryPostReportRepository: WorryPostReportRepository,
    private val worryCommentReportRepository: WorryCommentReportRepository,
    private val worryPostRepository: WorryPostRepository,
    private val worryCommentRepository: WorryCommentRepository,
    private val memberRepository: MemberRepository,
    private val adminActionRecorder: AdminActionRecorder,
) {

    @Transactional(readOnly = true)
    fun findPostReports(
        status: AdminWorryStatus?,
        authorId: Long?,
        page: Int,
        size: Int,
    ): AdminWorryPostReportPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)

        val posts = worryPostReportRepository.findPostsForAdmin(
            status = status?.name,
            authorId = authorId,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val totalCount = worryPostReportRepository.countPostsForAdmin(status?.name, authorId)
        val reporters = posts.map { it.postId }
            .takeIf { it.isNotEmpty() }
            ?.let { worryPostReportRepository.findReportersByPostIdIn(it) }
            .orEmpty()
        val nicknames = findNicknames(posts.map { it.authorId } + reporters.map { it.reporterId })

        return AdminWorryPostReportPageResponse(
            items = posts.map { post ->
                AdminWorryPostReportResponse(
                    postId = post.postId,
                    authorId = post.authorId,
                    authorNickname = nicknames[post.authorId] ?: UNKNOWN_NICKNAME,
                    content = post.content,
                    reportCount = post.reportCount,
                    postDeletedAt = post.postDeletedAt,
                    lastReportedAt = post.lastReportedAt,
                    reporters = reporters.filter { it.targetId == post.postId }
                        .map { toReporter(it.reporterId, it.createdAt, nicknames) },
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = totalCount,
        )
    }

    @Transactional(readOnly = true)
    fun findCommentReports(
        status: AdminWorryStatus?,
        authorId: Long?,
        page: Int,
        size: Int,
    ): AdminWorryCommentReportPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)

        val comments = worryCommentReportRepository.findCommentsForAdmin(
            status = status?.name,
            authorId = authorId,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val totalCount = worryCommentReportRepository.countCommentsForAdmin(status?.name, authorId)
        val reporters = comments.map { it.commentId }
            .takeIf { it.isNotEmpty() }
            ?.let { worryCommentReportRepository.findReportersByCommentIdIn(it) }
            .orEmpty()
        val nicknames = findNicknames(comments.map { it.authorId } + reporters.map { it.reporterId })

        return AdminWorryCommentReportPageResponse(
            items = comments.map { comment ->
                AdminWorryCommentReportResponse(
                    commentId = comment.commentId,
                    postId = comment.postId,
                    authorId = comment.authorId,
                    authorNickname = nicknames[comment.authorId] ?: UNKNOWN_NICKNAME,
                    content = comment.content,
                    reportCount = comment.reportCount,
                    commentDeletedAt = comment.commentDeletedAt,
                    deletedByReport = comment.deletedByReport,
                    lastReportedAt = comment.lastReportedAt,
                    reporters = reporters.filter { it.targetId == comment.commentId }
                        .map { toReporter(it.reporterId, it.createdAt, nicknames) },
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = totalCount,
        )
    }

    @Transactional
    fun deletePost(actorId: Long, postId: Long) {
        val post = worryPostRepository.findById(postId).orElseThrow {
            BusinessException(ErrorCode.WORRY_POST_NOT_FOUND)
        }

        worryPostRepository.delete(post)
        adminActionRecorder.record(actorId, AdminActionType.DELETE_WORRY_POST, postId)
    }

    @Transactional
    fun deleteComment(actorId: Long, commentId: Long) {
        val comment = worryCommentRepository.findById(commentId).orElseThrow {
            BusinessException(ErrorCode.WORRY_COMMENT_NOT_FOUND)
        }

        worryCommentRepository.delete(comment)
        worryPostRepository.decreaseCommentCount(comment.postId)
        adminActionRecorder.record(actorId, AdminActionType.DELETE_WORRY_COMMENT, commentId)
    }

    private fun findNicknames(memberIds: List<Long>): Map<Long, String> {
        val distinct = memberIds.distinct()

        if (distinct.isEmpty()) {
            return emptyMap()
        }

        return memberRepository.findNicknamesByIdIn(distinct).associate { it.id to it.nickname }
    }

    private fun toReporter(
        reporterId: Long,
        reportedAt: Instant,
        nicknames: Map<Long, String>,
    ) = AdminWorryReporterResponse(
        id = reporterId,
        nickname = nicknames[reporterId] ?: UNKNOWN_NICKNAME,
        reportedAt = reportedAt,
    )

    companion object {

        private const val UNKNOWN_NICKNAME = "알 수 없음"
    }
}
