package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminFeedPostStatus
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReportPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminFeedReportResponse
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
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, MAX_PAGE_SIZE)

        val rows = feedPostReportRepository.findAllForAdmin(
            status = status?.name,
            authorId = authorId,
            size = safeSize,
            offset = (safePage - 1) * safeSize,
        )
        val totalCount = feedPostReportRepository.countForAdmin(status?.name, authorId)

        val memberIds = rows.flatMap { listOf(it.reporterId, it.authorId) }.distinct()
        val nicknames = if (memberIds.isEmpty()) {
            emptyMap()
        } else {
            memberRepository.findNicknamesByIdIn(memberIds).associate { it.id to it.nickname }
        }

        return AdminFeedReportPageResponse(
            items = rows.map {
                AdminFeedReportResponse(
                    id = it.id,
                    reporterId = it.reporterId,
                    reporterNickname = nicknames[it.reporterId] ?: UNKNOWN_NICKNAME,
                    postId = it.postId,
                    authorId = it.authorId,
                    authorNickname = nicknames[it.authorId] ?: UNKNOWN_NICKNAME,
                    thumbnailUrl = photoStorage.toPublicUrl(it.objectKey),
                    caption = it.caption,
                    postReportCount = it.postReportCount,
                    postDeletedAt = it.postDeletedAt,
                    createdAt = it.createdAt,
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

        const val MAX_PAGE_SIZE = 100

        private const val UNKNOWN_NICKNAME = "알 수 없음"
    }
}
