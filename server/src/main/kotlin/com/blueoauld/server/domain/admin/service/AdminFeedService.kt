package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminFeedPostStatus
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReportPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReportResponse
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReporterResponse
import com.blueoauld.server.domain.feed.repository.FeedPostReportRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminFeedService(

    private val feedPostReportRepository: FeedPostReportRepository,
    private val feedPostRepository: FeedPostRepository,
    private val memberRepository: MemberRepository,
    private val photoStorage: PhotoStorage,
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

        val posts = feedPostReportRepository.findPostsForAdmin(
            status = status?.name,
            authorId = authorId,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val totalCount = feedPostReportRepository.countPostsForAdmin(status?.name, authorId)
        val reporters = posts.map { it.postId }
            .takeIf { it.isNotEmpty() }
            ?.let { feedPostReportRepository.findReportersByPostIdIn(it) }
            .orEmpty()

        val memberIds = (posts.map { it.authorId } + reporters.map { it.reporterId }).distinct()
        val nicknames = if (memberIds.isEmpty()) {
            emptyMap()
        } else {
            memberRepository.findNicknamesByIdIn(memberIds).associate { it.id to it.nickname }
        }

        return AdminFeedReportPageResponse(
            items = posts.map { post ->
                AdminFeedReportResponse(
                    postId = post.postId,
                    authorId = post.authorId,
                    authorNickname = nicknames[post.authorId] ?: UNKNOWN_NICKNAME,
                    thumbnailUrl = photoStorage.toPublicUrl(post.objectKey),
                    caption = post.caption,
                    reportCount = post.reportCount,
                    postDeletedAt = post.postDeletedAt,
                    lastReportedAt = post.lastReportedAt,
                    reporters = reporters.filter { it.postId == post.postId }.map {
                        AdminFeedReporterResponse(
                            id = it.reporterId,
                            nickname = nicknames[it.reporterId] ?: UNKNOWN_NICKNAME,
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
    fun deletePost(postId: Long) {
        val post = feedPostRepository.findById(postId).orElseThrow {
            BusinessException(ErrorCode.FEED_POST_NOT_FOUND)
        }

        feedPostRepository.delete(post)
    }

    companion object {

        private const val UNKNOWN_NICKNAME = "알 수 없음"
    }
}
