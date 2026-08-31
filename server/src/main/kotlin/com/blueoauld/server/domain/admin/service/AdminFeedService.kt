package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminFeedPostStatus
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReportPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReportResponse
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReporterResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.FeedAdminRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminFeedService(

    private val feedAdminRepository: FeedAdminRepository,
    private val feedPostRepository: FeedPostRepository,
    private val memberAdminService: MemberAdminService,
    private val photoStorage: PhotoStorage,
    private val adminActionRecorder: AdminActionRecorder,
) {

    @Transactional(readOnly = true)
    fun findReports(
        status: AdminFeedPostStatus?,
        authorId: Long?,
        page: Int,
        size: Int,
    ): AdminFeedReportPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)

        val posts = feedAdminRepository.findPostsForAdmin(
            status = status?.name,
            authorId = authorId,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val totalCount = feedAdminRepository.countPostsForAdmin(status?.name, authorId)
        val reporters = posts.map { it.postId }
            .takeIf { it.isNotEmpty() }
            ?.let { feedAdminRepository.findReportersByPostIdIn(it) }
            .orEmpty()

        val nicknames = memberAdminService.findNicknames(
            posts.map { it.authorId } + reporters.map { it.reporterId },
        )

        return AdminFeedReportPageResponse(
            items = posts.map { post ->
                AdminFeedReportResponse(
                    postId = post.postId,
                    authorId = post.authorId,
                    authorNickname = nicknames.getValue(post.authorId),
                    thumbnailUrl = photoStorage.toPublicUrl(post.objectKey),
                    caption = post.caption,
                    reportCount = post.reportCount,
                    postDeletedAt = post.postDeletedAt,
                    lastReportedAt = post.lastReportedAt,
                    reporters = reporters.filter { it.postId == post.postId }.map {
                        AdminFeedReporterResponse(
                            id = it.reporterId,
                            nickname = nicknames.getValue(it.reporterId),
                            reportedAt = it.createdAt,
                        )
                    },
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = totalCount,
        )
    }

    @Transactional
    fun deletePost(actorId: Long, postId: Long) {
        val post = feedPostRepository.findById(postId).orElseThrow {
            BusinessException(ErrorCode.FEED_POST_NOT_FOUND)
        }

        feedPostRepository.delete(post)
        adminActionRecorder.record(actorId, AdminActionType.DELETE_FEED_POST, postId)
    }
}
