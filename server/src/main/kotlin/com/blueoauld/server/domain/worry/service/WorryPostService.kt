package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.dto.projection.WorryPostRow
import com.blueoauld.server.domain.worry.dto.request.CreateWorryPostRequest
import com.blueoauld.server.domain.worry.dto.response.WorryPostResponse
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import com.blueoauld.server.domain.worry.entity.type.WorrySort
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.repository.escapeLike
import com.blueoauld.server.global.response.CursorResponse
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.today
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.temporal.ChronoUnit

@Service
class WorryPostService(

    private val worryPostRepository: WorryPostRepository,
    private val worryPostLikeRepository: WorryPostLikeRepository,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun find(
        memberId: Long,
        sort: WorrySort,
        category: WorryCategory?,
        cursor: Long?,
        size: Int,
    ): CursorResponse<WorryPostResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val categoryName = category?.name
        val rows = when (sort) {
            WorrySort.LATEST -> worryPostRepository.findLatestFirst(memberId, categoryName, cursor, pageSize)

            WorrySort.POPULAR -> {
                val cursorLikeCount = cursor?.let {
                    worryPostRepository.findLikeCountById(it) ?: return emptyPage()
                }

                worryPostRepository.findMostLikedFirst(memberId, categoryName, cursorLikeCount, cursor, pageSize)
            }

            WorrySort.COMMENT -> {
                val cursorCommentCount = cursor?.let {
                    worryPostRepository.findCommentCountById(it) ?: return emptyPage()
                }

                worryPostRepository.findMostCommentedFirst(
                    memberId,
                    categoryName,
                    cursorCommentCount,
                    cursor,
                    pageSize,
                )
            }
        }

        return CursorResponse(
            items = rows.map { toResponse(it, memberId) },
            nextCursor = rows.lastOrNull()?.getPostId().takeIf { rows.size == pageSize },
        )
    }

    @Transactional(readOnly = true)
    fun findMine(memberId: Long, cursor: Long?, size: Int): CursorResponse<WorryPostResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val rows = worryPostRepository.findMineLatestFirst(memberId, cursor, pageSize)

        return CursorResponse(
            items = rows.map { toResponse(it, memberId) },
            nextCursor = rows.lastOrNull()?.getPostId().takeIf { rows.size == pageSize },
        )
    }

    @Transactional(readOnly = true)
    fun search(memberId: Long, keyword: String, cursor: Long?, size: Int): CursorResponse<WorryPostResponse> {
        val trimmed = keyword.trim()

        if (trimmed.length < MIN_KEYWORD_LENGTH) {
            return emptyPage()
        }

        val pageSize = CursorResponse.pageSize(size)
        val rows = worryPostRepository.search(memberId, "%${trimmed.escapeLike()}%", cursor, pageSize)

        return CursorResponse(
            items = rows.map { toResponse(it, memberId) },
            nextCursor = rows.lastOrNull()?.getPostId().takeIf { rows.size == pageSize },
        )
    }

    @Transactional(readOnly = true)
    fun findDetail(memberId: Long, postId: Long): WorryPostResponse {
        val post = worryPostRepository.findById(postId).orElseThrow {
            BusinessException(ErrorCode.WORRY_POST_NOT_FOUND)
        }

        return WorryPostResponse(
            worryId = post.id,
            category = post.category,
            content = post.content,
            createdAt = post.createdAt,
            likeCount = post.likeCount,
            commentCount = post.commentCount,
            likedByMe = worryPostLikeRepository.existsByPostIdAndMemberId(postId, memberId),
            mine = post.memberId == memberId,
        )
    }

    @Transactional
    fun create(memberId: Long, request: CreateWorryPostRequest) {
        val from = clock.today().atStartOfDay(KOREA).toInstant()
        val to = from.plus(1, ChronoUnit.DAYS)

        if (worryPostRepository.countByMemberIdBetween(memberId, from, to) >= DAILY_POST_LIMIT) {
            throw BusinessException(ErrorCode.WORRY_DAILY_LIMIT)
        }

        worryPostRepository.saveAndFlush(
            WorryPost(memberId = memberId, category = request.category, content = request.content),
        )
    }

    @Transactional
    fun delete(memberId: Long, postId: Long) {
        val post = findPost(postId)

        if (post.memberId != memberId) {
            throw BusinessException(ErrorCode.NOT_WORRY_POST_AUTHOR)
        }

        worryPostRepository.delete(post)
    }

    @Transactional
    fun deleteByAdmin(postId: Long) {
        worryPostRepository.delete(findPost(postId))
    }

    private fun findPost(postId: Long) = worryPostRepository.findById(postId).orElseThrow {
        BusinessException(ErrorCode.WORRY_POST_NOT_FOUND)
    }

    private fun emptyPage() = CursorResponse<WorryPostResponse>(emptyList(), null)

    private fun toResponse(row: WorryPostRow, memberId: Long) = WorryPostResponse(
        worryId = row.getPostId(),
        category = WorryCategory.valueOf(row.getCategory()),
        content = row.getContent(),
        createdAt = row.getCreatedAt(),
        likeCount = row.getLikeCount(),
        commentCount = row.getCommentCount(),
        likedByMe = row.getLikedByMe(),
        mine = row.getMemberId() == memberId,
    )

    companion object {

        const val DAILY_POST_LIMIT = 5
        const val MIN_KEYWORD_LENGTH = 2
    }
}
